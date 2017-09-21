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
export declare class Database {
    constructor(schema: SchemaBuilder, idb: any);
    private _idb;
    private _schema;
    private _repositoryConfigs;
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
    static open(dbName: any, options: any, indexedDB?: any): Promise<Database>;
    /**
     * Start a transaction.
     * @returns {Promise} A promise to resolve once the transaction has completed processing.
     */
    transact(mode: any, fn: any): any;
    /**
     * Set the IDBDatabase instance held by this Database instance
     * @param {IDBDatabase} idb The {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} instance
     */
    setIDB(idb: any): void;
    /**
     * Retrieve a repository
     *
     * @param {String} name The name of the repository to retrieve
     * @param {type} tx An optional transaction which the repository should be associated with
     * @returns {module:dibello.Repository} The new repository object
     */
    repository(name: any, tx?: any): Repository<{}>;
    /**
     * Prepare the given Repository instance by calling any config functions
     * registered for its name.
     *
     * @param {module:dibello.Repository} repository The repository which must be prepared
     */
    prepareRepository(repository: any): void;
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
    configRepository(name: any, cb: any): void;
    /**
     * Get the schema of this database, as determined by the migrations which initialized
     * it. This is mostly for use internally but can be useful for debugging (see
     * SchemaBuilder.debug()).
     *
     * @returns {module:dibello.SchemaBuilder} The SchemaBuilder containing this database's current schema
     */
    getSchema(): SchemaBuilder;
    /**
     * Retrieve the underlying {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} instance
     * @returns {IDBDatabase} The {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} instance
     */
    idb(): IDBDatabase;
}
