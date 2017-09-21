"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module providing Dibello's Database class which wraps an IndexedDB database to provide
 * access to Dibello's features as well as the underlying IndexedDB features.
 *
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti
 */
var transact_1 = require("@dibello/transact");
var repository_1 = require("@dibello/repository");
var schema_builder_1 = require("@dibello/schema-builder");
/**
 * Constructs a Database object which represents an IndexedDB database.
 *
 * @class
 * @alias module:dibello.Database
 * @param {module:dibello.SchemaBuilder} schema A representation of the database's intended schema
 * @param {IDBDatabase} idb An opened IndexedDB database
 *
 */
var Database = /** @class */ (function () {
    function Database(schema, idb) {
        if (!schema)
            throw "Must pass a SchemaBuilder as 'schema' to the dibello.Database constructor";
        this._schema = schema;
        this._idb = idb;
        this._repositoryConfigs = {};
    }
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
    Database.open = function (dbName, options, indexedDB) {
        if (!indexedDB)
            indexedDB = window.indexedDB;
        // Process options
        var version = 1;
        if (options.version)
            version = options.version;
        // Ready promise
        var resolveReady;
        var rejectReady;
        var ready = new Promise(function (resolve, reject) {
            resolveReady = resolve;
            rejectReady = reject;
        });
        var schema = new schema_builder_1.SchemaBuilder(dbName, this);
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
            if (!options.migrations) {
                throw new Error("Cowardly refusing to upgrade when no migrations are specified.");
            }
            for (var version_1 = 1; version_1 <= oldVersion; ++version_1) {
                //console.log(' - Loading schema version #'+version+' (model-only)');
                if (options.migrations[version_1])
                    options.migrations[version_1](schema);
            }
            schema.setDatabase(db, event.currentTarget.transaction);
            idb.onerror = function (event) {
                console.error('[dibello] Error while building database schema');
                console.error(event);
            };
            //console.log('[dibello] Applying migrations...');
            for (var version_2 = oldVersion + 1; version_2 <= newVersion; ++version_2) {
                //console.log('[dibello] - Applying schema version #'+version+' (live)');
                options.migrations[version_2](schema);
            }
            schema.disconnectDatabase();
            //console.log('Schema updated successfully.');
            idb.onerror = null;
        };
        return ready;
    };
    /**
     * Start a transaction.
     * @returns {Promise} A promise to resolve once the transaction has completed processing.
     */
    Database.prototype.transact = function (mode, fn) {
        if (typeof mode !== 'string') {
            throw 'First parameter must be a mode string';
        }
        var self = this;
        return transact_1.transact(this, null, function (db, name, transaction) {
            return self.repository(name, transaction);
        }, fn, mode);
    };
    ;
    /**
     * Set the IDBDatabase instance held by this Database instance
     * @param {IDBDatabase} idb The {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} instance
     */
    Database.prototype.setIDB = function (idb) {
        this._idb = idb;
    };
    ;
    /**
     * Retrieve a repository
     *
     * @param {String} name The name of the repository to retrieve
     * @param {type} tx An optional transaction which the repository should be associated with
     * @returns {module:dibello.Repository} The new repository object
     */
    Database.prototype.repository = function (name, tx) {
        var repo = new repository_1.Repository(this, name, tx);
        this.prepareRepository(repo);
        return repo;
    };
    ;
    /**
     * Prepare the given Repository instance by calling any config functions
     * registered for its name.
     *
     * @param {module:dibello.Repository} repository The repository which must be prepared
     */
    Database.prototype.prepareRepository = function (repository) {
        if (this._repositoryConfigs[repository.storeName])
            this._repositoryConfigs[repository.storeName](repository);
    };
    ;
    /**
     * Registers a configuration function. Whenever a repository of this
     * type needs to be made, the given function will be called.
     * It is possible to have multiple configurers, but should be avoided
     * for simplicity.
     *
     * @param {String} name The name of the repository to configure
     * @param {function} cb A callback which will be called for each
     *		instance of the desired repository which is created
    */
    Database.prototype.configRepository = function (name, cb) {
        if (this._repositoryConfigs[name]) {
            var original = this._repositoryConfigs[name];
            this._repositoryConfigs[name] = function (repo) {
                original(repo);
                cb(repo);
            };
        }
        else {
            this._repositoryConfigs[name] = cb;
        }
    };
    ;
    /**
     * Get the schema of this database, as determined by the migrations which initialized
     * it. This is mostly for use internally but can be useful for debugging (see
     * SchemaBuilder.debug()).
     *
     * @returns {module:dibello.SchemaBuilder} The SchemaBuilder containing this database's current schema
     */
    Database.prototype.getSchema = function () {
        return this._schema;
    };
    /**
     * Retrieve the underlying {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} instance
     * @returns {IDBDatabase} The {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} instance
     */
    Database.prototype.idb = function () {
        return this._idb;
    };
    ;
    return Database;
}());
exports.Database = Database;
