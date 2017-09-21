/**
 * Module providing Dibello's Database class which wraps an IndexedDB database to provide
 * access to Dibello's features as well as the underlying IndexedDB features.
 * 
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti
 */
import { transact } from '@dibello/transact';
import { Repository } from '@dibello/repository';
import { SchemaBuilder } from '@dibello/schema-builder';

/**
 * Constructs a Database object which represents an IndexedDB database.
 * 
 * @class
 * @alias module:dibello.Database
 * @param {module:dibello.SchemaBuilder} schema A representation of the database's intended schema
 * @param {IDBDatabase} idb An opened IndexedDB database
 * 
 */
export class Database {
	constructor(schema : SchemaBuilder, idb) {
		if (!schema)
			throw "Must pass a SchemaBuilder as 'schema' to the dibello.Database constructor";
		this._schema = schema;
		this._idb = idb;
		this._repositoryConfigs = {};
	}

	private _idb : IDBDatabase;
	private _schema : SchemaBuilder;
	private _repositoryConfigs : { [name : string] : (repo : Repository<any>) => void; }
	
	/**
	 * Returns a promise to open an IndexedDB database using Dibello's schema manager.
	 * 
	 * You must pass the top-level indexedDB API object. If you are in a browser which
	 * supports IndexedDB, then simply pass window.indexedDB. If you are in Node.js 
	 * using indexeddb-js, then you should pass the indexeddbjs.indexedDB instance you
	 * normally construct.
	 * 
	 * When the promise resolves you will receive a dibello.Database instance.
	 * 
	 * In order for Dibello to prepare the database, you must provide the desired IDB 
	 * database name and a set of options.
	 * 
	 * Migrations
	 * 
	 * The most important option is 'migrations', which must be an
	 * object with numeric keys, one for each revision of the database.
	 * The 'version' option chooses what version of the schema Dibello 
	 * should consider current. During open(), Dibello will apply the 
	 * schema you define within your migrations functions to the given
	 * IDB database. 
	 * 
	 * Since Dibello only knows about your database schema through your migrations,
	 * they are structured in a particular way. You cannot interact with data within
	 * the database during a migration unless you are within a run() block. This is 
	 * because your migrations are _always run_ to construct a model of your schema. 
	 * The IDB database is only modified when a version migration operation is underway,
	 * and this includes run() blocks. 
	 * 
	 * Because of this, you should not attempt to do anything other than modify the 
	 * schema using the SchemaBuilder instance you are given when you are outside of a run()
	 * block!
	 *  
	 * Example:
	 * 
	 * ```js
	 * dibello.open('apples', {
	 *		migrations: {
	 *			'1': function(schema) {
	 *				// This is our perfect apples schema.
	 *				// We're very sure right now that this won't need to be changed.
	 *				
	 *				schema.createStore('apples')
	 *					.id('id'),
	 *					.key('color')
	 *					.field('history')
	 *				;
	 *			},
	 *			'2': function(schema) {
	 *				// Let's add a size key, we didn't realize we needed it before
	 *				
	 *				schema.getStore('apples')
	 *					.key('size')
	 *				;
	 *			},
	 *			'3': function(schema) {
	 *					
	 *				// Change 'size' from a bunch of strings to a numeric type
	 *				
	 *				schema.getStore('apples')
	 *					.run(function(apples) {
	 *						apples.all().emit(function(apple) {
	 *							var map = { small: 2, medium: 3, large: 4, 'extra-large': 5 };
	 *							
	 *							if (apple.size) {
	 *								var neuSize = map[apple.size];
	 *								apple.size = neuSize;
	 *							}
	 *							
	 *							apples.persist(apple);
	 *						});
	 *					})
	 *				;
	 *			},
	 *		}
	 * }).then(function(db) {
	 *		// Hey, lets use it!
	 *		
	 *		db.transact(function(apples) {
	 *			apples.find({
	 *				size: 'large'
	 *			}).emit(function(apple) {
	 *				console.log('Found a large apple!', apple);
	 *			});
	 *		})
	 * });
	 * ```
	 * 
	 * @static
	 * @param string dbName
	 * @param object options
	 * @returns {Promise|module:dibello.Database}
	 */
	static open(dbName : string, options, indexedDB?): Promise<Database> {
		if (!indexedDB)
			indexedDB = window.indexedDB;

		// Process options
		
		var version = 1;
		if (options.version)
			version = options.version;
		
		// Ready promise
		
		let resolveReady : (db : Database) => void;
		var rejectReady : (err? : any) => void;
		
		var ready = new Promise<Database>(function(resolve, reject) {
			resolveReady = resolve;
			rejectReady = reject;
		});
		
		var schema = new SchemaBuilder(dbName, this);
		var db = new Database(schema, null);
		var migrated = false;
		
		// Open DB request
		
		var DBOpenRequest = indexedDB.open(dbName, version);

		// these two event handlers act on the database being opened successfully, or not
		DBOpenRequest.onerror = function (event) {
			rejectReady();
		};

		DBOpenRequest.onsuccess = function (event) {
			var idb = event.target.result;
			db.setIDB(idb);
				
			// If we didn't migrate, populate the schema as necessary
			if (!migrated && options.migrations) {
				for (var v = 1; v <= version; ++v) {
					options.migrations[v](schema);
				}
			}
			
			resolveReady(db);
		};

		// Construct the final schema

		// This event handles the event whereby a new version of the database needs to be created
		// Either one has not been created before, or a new version number has been submitted via the
		// window.indexedDB.open line above
		//it is only implemented in recent browsers
		DBOpenRequest.onupgradeneeded = function (event) {
			migrated = true;
			let idb = event.target.result;
			
			db.setIDB(idb);
			schema.setDatabase(db, null);
			
			let oldVersion = event.oldVersion;
			let newVersion = event.newVersion;
			
			if (!options.migrations) {
				throw new Error("Cowardly refusing to upgrade when no migrations are specified.");
			}
			
			for (let version = 1; version <= oldVersion; ++version) {
				//console.log(' - Loading schema version #'+version+' (model-only)');
				if (options.migrations[version])
					options.migrations[version](schema);
			}
			
			schema.setDatabase(db, event.currentTarget.transaction);
			
			idb.onerror = function (event) {
				console.error('[dibello] Error while building database schema');
				console.error(event);
			};

			//console.log('[dibello] Applying migrations...');
			for (let version = oldVersion+1; version <= newVersion; ++version) {
				//console.log('[dibello] - Applying schema version #'+version+' (live)');
				options.migrations[version](schema);
			}
				
			schema.disconnectDatabase();
			//console.log('Schema updated successfully.');

			idb.onerror = null;
		};
		
		return ready;
	}

	/**
	 * Start a transaction.
	 * @returns {Promise} A promise to resolve once the transaction has completed processing.
	 */
	transact<T>(mode, fn : (...args) => T | Promise<T>): T | Promise<T> {
		
		if (typeof mode !== 'string') {
			throw 'First parameter must be a mode string';
		}
		
		var self = this;
		return transact(this, null, function(db, name, transaction) {
			return self.repository(name, transaction);
		}, fn, mode);
	};

	/**
	 * Set the IDBDatabase instance held by this Database instance
	 * @param {IDBDatabase} idb The {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} instance
	 */
	setIDB(idb) {
		this._idb = idb;
	};

	/**
	 * Retrieve a repository
	 * 
	 * @param name The name of the repository to retrieve
	 * @param tx An optional transaction which the repository should be associated with
	 * @returns The new repository object
	 */
	repository<T>(name : string, tx? : IDBTransaction): Repository<T> {
		var repo = new Repository<T>(this, name, tx);
		this.prepareRepository(repo);
		return repo;
	};

	/**
	 * Prepare the given Repository instance by calling any config functions
	 * registered for its name.
	 * 
	 * @param repository The repository which must be prepared
	 */
	prepareRepository<T>(repository : Repository<T>) {
		if (this._repositoryConfigs[repository.storeName])
			this._repositoryConfigs[repository.storeName](repository);
	};

	/**
	 * Registers a configuration function. Whenever a repository of this 
	 * type needs to be made, the given function will be called. 
	 * It is possible to have multiple configurers, but should be avoided 
	 * for simplicity.
	 * 
	 * @param name The name of the repository to configure
	 * @param cb A callback which will be called for each 
	 *		instance of the desired repository which is created
	*/
	configRepository(name : string, cb) {
		if (this._repositoryConfigs[name]) {
			var original = this._repositoryConfigs[name];
			this._repositoryConfigs[name] = function(repo) {
				original(repo);
				cb(repo);
			}; 
		} else {
			this._repositoryConfigs[name] = cb;
		}
	};

	/**
	 * Get the schema of this database, as determined by the migrations which initialized 
	 * it. This is mostly for use internally but can be useful for debugging (see 
	 * SchemaBuilder.debug()).
	 * 
	 * @returns The SchemaBuilder containing this database's current schema
	 */
	getSchema(): SchemaBuilder {
		return this._schema;
	}

	/**
	 * Retrieve the underlying {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} instance 
	 * @returns The {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} instance
	 */
	idb(): IDBDatabase {
		return this._idb;
	};
}