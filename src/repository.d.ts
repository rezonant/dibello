import { Database } from '@dibello/database';
import { Index } from '@dibello/index';
/**
 * Provides a high-level API on top of an IndexedDB object store (IDBObjectStore)
 */
export declare class Repository<T> {
    constructor(db: Database | Promise<Database>, storeName: string, transaction?: IDBTransaction);
    private _ready;
    private _storeName;
    private _transaction;
    readonly transaction: IDBTransaction;
    readonly storeName: string;
    readonly ready: Promise<Database>;
    /**
     * Dehydrates (flattens) the properties of the given object.
     * If the corresponding hydrate() call has fetched associated items and attached them to an item,
     * this method should replace those fetched items with the original IDs so that the item can be persisted
     * back into the object store.
     *
     * This method can be overridden for a specific repository by using
     * {@link module:dibello.Database#configRepository}
     *
     * @param {type} item
     * @see {@link module:dibello/Database~Database#configRepository Database.configRepository}
     * @see {@link module:dibello/Database~Database#transact Database.transact}
     * @returns {undefined}
     */
    dehydrate(db: Database, item: any): void;
    /**
     * Returns a promise to hydrate the properties of a given object.
     * This function is called using dibello/Database.transact(), so you can request
     * repositories or other dependencies using Dibello's function injection mechanism.
     *
     * @see {@link module:dibello/Database~Database#transact Database.transact}
     * @param {type} item In addition to the standard transact services, you may also inject 'item' which is the item being hydrated
     * @returns {unresolved}
     */
    hydrate(item: any): Promise<T>;
    /**
     * Get an IndexedDB transaction (IDBTransaction) for only the store represented by
     * this repository. The resulting transaction cannot be used to access any other store.
     *
     * @param {Database} db The Database instance
     * @returns {type|IDBTransaction}
     */
    getStoreTransaction(db: Database, mode?: 'readwrite' | 'readonly' | 'versionchange'): IDBTransaction;
    _hydrateItem(db: Database, item: any): T;
    _dehydrateItem(db: any, item: any): any;
    /**
     * Generate a GUID which may be used as the ID for a new object.
     * @returns {String} The new GUID
     */
    static generateGuid(): any;
    /**
     * Set the transaction on this repository object so that future operations
     * use it instead of creating a new one. This is used during dibello.transact()
     * calls to ensure that a new Repository will use the newly created transaction
     * (amongst other uses).
     */
    setTransaction(tx: IDBTransaction): void;
    /**
     * On a transacted Repository instance, this method returns the underlying
     * object store instance (IDBObjectStore). If called on a non-transacted
     * Repository (ie one created with {@link module:dibello/Database~Database#repository Database.repository()}),
     * this method will throw an exception.
     *
     * @returns {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore IDBObjectStore}
     */
    getStore(): IDBObjectStore;
    /**
     * Persist the given item into the object store.
     * Return a promise to resolve once the operation is completed.
     *
     * @param {object} item The object which should be persisted
     * @returns {Promise} Resolves once the operation is completed.
     */
    persist(item: any): Promise<void>;
    /**
     * Promises to return a single item.
     *
     * @param {String} id The ID of the object to fetch
     * @returns {Promise} A promise to return the item
     */
    get(id: any): Promise<any>;
    /**
     * Iterate over all items in the object store.
     */
    all(): AsyncIterableIterator<AsyncIterable<T>>;
    /**
     * Retrieve an index object which allows for querying a specific index.
     *
     * @param {String} name The name of the index to retrieve
     * @returns {Index}
     */
    index<TIndex>(name: any): Index<T, TIndex>;
    /**
     * Open a cursor on the main index of this object store
     *
     * @param {IDBKeyRange} An optional {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange IDBKeyRange}
     *		instance specifying the range of the query
    */
    cursor(range?: any): AsyncIterableIterator<AsyncIterable<T>>;
    /**
     * Look up many items with many keys at once.
     * Result is a generator which will emit each of the items.
     * TODO: Can we do this using cursors and key ranges?
     *
     * @param {Array} ids An array of IDs which should be looked up
     * @returns {Generator}
     */
    getMany(ids: any[], includeNulls?: boolean): AsyncIterableIterator<T>;
    /**
     * Find all objects which match a given criteria object.
     * This is "query by example".
     *
     * Performance: For best performance, define the most-specific
     * key first. This is because the first key found in the criteria
     * object will be used to do the actual database query. The result of
     * this query will be stored in memory, then all subsequent
     * keys will filter the result set until the final result is obtained.
     *
     * @param {object} criteria An object containing key/value pairs to search for. The first
     *		key/value pair is used as an index.
    * @returns {Promise} A promise to return the matching items
    */
    find(criteria: any): AsyncIterableIterator<T>;
    /**
     * Promises to resolve once the item has been deleted.
     *
     * @param {String} id The ID of the object to delete
     * @returns {Promise} A promise to resolve once the item has been deleted.
     */
    delete(id: any): Promise<{}>;
}
