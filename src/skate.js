/**  
 * Skate! is a high-level ORM framework on top of 
 * HTML5 IndexedDB. 
 * 
 * It can be used to dramatically simplify code which 
 * uses IndexedDB to persist Javascript objects into the user's
 * browser. 
 * 
 * ### Skate is:
 * - A powerful migration management system which doubles as a 
 *   description of the object schema for powering Skate's ORM features
 * - An injection-driven way to express IndexedDB transactions
 *   which dramatically simplifies using IndexedDB.
 * - A rich repository layer that builds upon the capabilities of
 *   IndexedDB object stores by providing more advanced query methods 
 *   and a unified, terse way to consume the results of IndexedDB requests
 *   
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti
 * @module skate
 */


require('./idbStandardize.js');

var SchemaBuilder = require('./SchemaBuilder.js');
var StoreBuilder = require('./StoreBuilder.js');
var Repository = require('./Repository.js');
var transact = require('./transact.js');
var Generator = require('es5-generators');
var Database = require('./Database.js');
// API

/**
 * @alias module:skate
 * @type skate
 */
var skate = { 
	/**
	 * Contains the version of the Skate library.
	 * @type String
	 */ 
	version: '0.1',
	
	/**
	 * Create a new repository object for the given database and object store.
	 * 
	 * @param {IDBDatabase} db
	 * @param {type} storeName
	 * @returns {Repository}
	 */
	repository: function(db, storeName) {
		return new Repository(db, storeName);
	},
	
	/**
	 * Returns a promise to open an IndexedDB database using Skate's schema manager.
	 * 
	 * You must pass the top-level indexedDB API object. If you are in a browser which
	 * supports IndexedDB, then simply pass window.indexedDB. If you are in Node.js 
	 * using indexeddb-js, then you should pass the indexeddbjs.indexedDB instance you
	 * normally construct.
	 * 
	 * When the promise resolves you will receive an IndexedDB IDBDatabase instance.
	 * 
	 * In order for Skate to prepare the database, you must provide the desired IDB 
	 * database name and a set of options.
	 * 
	 * MIGRATIONS
	 * The most important option is 'migrations', which must be an
	 * object with numeric keys, one for each revision of the database.
	 * The 'version' option chooses what version of the schema Skate 
	 * should consider current. During open(), Skate will apply the 
	 * schema you define within your migrations functions to the given
	 * IDB database. 
	 * 
	 * Since Skate only knows about your database schema through your migrations,
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
	 * skate.open('apples', {
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
	 *		skate.transact(db, function(apples) {
	 *			apples.find({
	 *				size: 'large'
	 *			}).emit(function(apple) {
	 *				console.log('Found a large apple!', apple);
	 *			});
	 *		})
	 * });
	 * ```
	 * 
	 * @param string dbName
	 * @param object options
	 * @returns {Promise|skate.open.ready}
	 */
	open: function(indexedDB, dbName, options) {
		// Process options
		
		var version = 1;
		if (options.version)
			version = options.version;
		
		// Ready promise
		
		var resolveReady;
		var rejectReady;
		
		var ready = new Promise(function(resolve, reject) {
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
			var idb = event.target.result;
			
			db.setIDB(idb);
			schema.setDatabase(db, null);
			
			var oldVersion = event.oldVersion;
			var newVersion = event.newVersion;
			
			//console.log('[skate] Schema update required from '+oldVersion+' to '+newVersion);
			//console.log('[skate] Loading schema history...');

			if (!options.migrations) {
				throw "Cowardly refusing to upgrade when no migrations are specified.";
			}
			
			for (var version = 1; version <= oldVersion; ++version) {
				//console.log(' - Loading schema version #'+version+' (model-only)');
				if (options.migrations[version])
					options.migrations[version](schema);
			}
			
			schema.setDatabase(db, event.currentTarget.transaction);
			
			idb.onerror = function (event) {
				console.error('[skate] Error while building database schema');
				console.log(event);
			};

			//console.log('[skate] Applying migrations...');
			for (var version = oldVersion+1; version <= newVersion; ++version) {
				//console.log('[skate] - Applying schema version #'+version+' (live)');
				options.migrations[version](schema);
			}
			 
			schema.disconnectDatabase();
			//console.log('Schema updated successfully.');

			idb.onerror = null;
		};
		
		return ready;
	}
}; module.exports = skate;
