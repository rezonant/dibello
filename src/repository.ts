/**
 * Module  which is providing a class which provides a high-level API on top
 * of an IndexedDB object store (IDBObjectStore)
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore MDN Reference - IDBObjectStore}
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti 
 */

// import { Generator } from 'es5-generators';
// import { IDBRequestGenerator } from './IDBRequestGenerator.js';
// import { IDBCursorGenerator } from './IDBCursorGenerator.js';

import { stripCopy } from './strip-copy';
import { Constraint } from './constraint';
import { transact } from './transact';
import { Database } from './database';
import { Index } from './index';
import { CriteriaFinder } from './criteria-finder';
import { idbRequestToPromise } from './utils/idb/request-to-promise';
import { idbRequestToIterable } from './utils/idb/request-to-iterable';

/**
 * Provides a high-level API on top of an IndexedDB object store (IDBObjectStore)
 */
export class Repository<T> {
	constructor(db : Database | Promise<Database>, storeName : string, transaction? : IDBTransaction) {
		var self = this;
		
		if (db instanceof Database)
			this._ready = Promise.resolve(db);
		else 
			this._ready = db;
		
		this._storeName = storeName;
		this._transaction = transaction? transaction : null;
	}

	private _ready : Promise<Database>;
	private _storeName : string;
	private _transaction : IDBTransaction;

	public get transaction() { return this._transaction; }
	public get storeName() { return this._storeName; }

	get ready() { return this._ready; }

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
	dehydrate(db : Database, item) {};

	/** 
	 * Returns a promise to hydrate the properties of a given object.
	 * This function is called using dibello/Database.transact(), so you can request
	 * repositories or other dependencies using Dibello's function injection mechanism.
	 * 
	 * @see {@link module:dibello/Database~Database#transact Database.transact} 
	 * @param {type} item In addition to the standard transact services, you may also inject 'item' which is the item being hydrated
	 * @returns {unresolved}
	 */
	async hydrate(item): Promise<T> { return item; };

	/**
	 * Get an IndexedDB transaction (IDBTransaction) for only the store represented by 
	 * this repository. The resulting transaction cannot be used to access any other store.
	 * 
	 * @param {Database} db The Database instance
	 * @returns {type|IDBTransaction}
	 */
	getStoreTransaction(db : Database, mode : 'readwrite' | 'readonly' | 'versionchange' = 'readwrite'): IDBTransaction {

		if (this._transaction)
			return this._transaction; 
		return db.idb().transaction([this._storeName], mode);
	}

	/*-*
	* Return a promise to hydrate the given item by 
	* transacting this repository's .hydrate() method.
	* 
	* @private
	* @param {module:dibello.Database} db Database instance
	* @param {object} item The item being hydrated
	*/
	_hydrateItem(db : Database, item): Promise<T> {
		var self = this; 
		
		// Standard hydration
		
		var schema = db.getSchema();
		var store = schema.getStore(self._storeName);
		var foreignFields = store.getForeignFields();
		
		return transact(db, null, function(db : Database, name : string, transaction : IDBTransaction) {
			return db.repository(name, transaction);
		}, ['item', self.hydrate], 'readonly', {
			item: item
		});
	};

	/*-*
	* Dehydrate the given item.
	* 
	* @param {type} db
	* @param {type} item
	* @returns {unresolved}
	*/
	_dehydrateItem(db, item) {
		this.dehydrate(db, item);
		
		// Standard dehydration
		
		return item;
	};

	/**
	 * Generate a GUID which may be used as the ID for a new object.
	 * @returns {String} The new GUID
	 */
	static generateGuid() {
		var result, i, j;
		result = '';
		for (j = 0; j < 32; j++) {
			if (j == 8 || j == 12 || j == 16 || j == 20)
				result = result + '-';
			i = Math.floor(Math.random() * 16).toString(16).toUpperCase();
			result = result + i;
		}
		return result;
	}

	/**
	 * Set the transaction on this repository object so that future operations 
	 * use it instead of creating a new one. This is used during dibello.transact()
	 * calls to ensure that a new Repository will use the newly created transaction
	 * (amongst other uses).
	 */
	setTransaction(tx : IDBTransaction) {
		this._transaction = tx;
	};

	/**
	 * On a transacted Repository instance, this method returns the underlying 
	 * object store instance (IDBObjectStore). If called on a non-transacted 
	 * Repository (ie one created with {@link module:dibello/Database~Database#repository Database.repository()}),
	 * this method will throw an exception.
	 * 
	 * @returns {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore IDBObjectStore}
	 */
	getStore(): IDBObjectStore {
		if (!this._transaction) {
			throw "Cannot get object store for a non-transaction repository";
		}
		
		return this._transaction.objectStore(this._storeName);
	}

	/**
	 * Persist the given item into the object store.
	 * Return a promise to resolve once the operation is completed.
	 * 
	 * @param {object} item The object which should be persisted
	 * @returns {Promise} Resolves once the operation is completed.
	 */
	async persist(item): Promise<void> {
		let db = await this.ready;
		let clone = this._dehydrateItem(db, stripCopy(item));
		var tx = this.getStoreTransaction(db);
		var store = tx.objectStore(this._storeName);

		return idbRequestToPromise<void>(store.put(clone, clone.id));
	};

	/**
	 * Promises to return a single item.
	 * 
	 * @param {String} id The ID of the object to fetch
	 * @returns {Promise} A promise to return the item
	 */
	async get(id): Promise<any> {
		var self = this;
		let db = await this.ready;
		var tx = self.getStoreTransaction(db);
		var store = tx.objectStore(self._storeName);
		let item = await idbRequestToPromise(store.get(id));
		
		return this._hydrateItem(db, item);
	};

	/**
	 * Iterate over all items in the object store.
	 */
	async *all() {
		let db = await this.ready;
		var tx = this.getStoreTransaction(db);
		var store = tx.objectStore(this._storeName);

		for await (let item of idbRequestToIterable(store.openCursor(), x => this._hydrateItem(db, x))) {
			yield item;
		}
	};

	/**
	 * Retrieve an index object which allows for querying a specific index.
	 * 
	 * @param {String} name The name of the index to retrieve
	 * @returns {Index}
	 */
	index<TIndex>(name): Index<T, TIndex> {
		return new Index<T, TIndex>(this, name);
	}

	/**
	 * Open a cursor on the main index of this object store
	 * 
	 * @param {IDBKeyRange} An optional {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange IDBKeyRange} 
	 *		instance specifying the range of the query
	*/
	async *cursor(range?) {
		let db = await this.ready;
		let tx = this.getStoreTransaction(db);
		let store = tx.objectStore(this._storeName);
		let iterable = idbRequestToIterable(
			store.openCursor(range), 
			x => this._hydrateItem(db, x)
		);

		for await (let item of iterable)
			yield item;
	}

	/**
	 * Look up many items with many keys at once.
	 * Result is a generator which will emit each of the items.
	 * TODO: Can we do this using cursors and key ranges?
	 * 
	 * @param {Array} ids An array of IDs which should be looked up
	 * @returns {Generator}
	 */
	async *getMany(ids : any[], includeNulls : boolean = false) {
		let db = await this.ready;
		let tx = this.getStoreTransaction(db);
		let store = tx.objectStore(this._storeName);

		for (let id of ids) {
			let rawItem = null;

			try {
				rawItem = await idbRequestToPromise(store.get(id));
			} catch (e) {
				if (!includeNulls)
					continue;
			}

			yield this._hydrateItem(db, rawItem);
		}
	};

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
	find(criteria) {
		let finder = new CriteriaFinder<T>(this);
		return finder.find(criteria);
	};

	/**
	 * Promises to resolve once the item has been deleted.
	 * 
	 * @param {String} id The ID of the object to delete
	 * @returns {Promise} A promise to resolve once the item has been deleted.
	 */
	async delete(id) {
		let db = await this.ready;
		let tx = this.getStoreTransaction(db);
		let store = tx.objectStore(this.storeName);

		return idbRequestToPromise(store.delete(id));
	}
}