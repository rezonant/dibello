/**
 * Module  which is providing a class which provides a high-level API on top
 * of an IndexedDB object store (IDBObjectStore)
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore MDN Reference - IDBObjectStore}
 * @module skate/Repository 
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti 
 */

var stripCopy = require('./stripCopy.js');
var Generator = require('es5-generators');
var IDBRequestGenerator = require('./IDBRequestGenerator.js');
var IDBCursorGenerator = require('./IDBCursorGenerator.js');

/**
 * 
 * Provides a high-level API on top of an IndexedDB 
 * object store (IDBObjectStore)
 * 
 * @class Repository
 * @param {Database} db The database to associate the repository with
 * @param {String} storeName The name of the store which this repository will represent
 * @param {IDBTransaction} transaction The optional IDB transaction to associate with the new repository
 * @returns {Repository}
 */
function Repository(db, storeName, transaction) {
	var self = this;
	
	if (db instanceof Promise) {
		this.ready = db;
	} else {
		this.ready = Promise.resolve(db);
	}
	
	this.storeName = storeName;
	this.transaction = transaction? transaction : null;
	
}; module.exports = Repository;

if (typeof window !== 'undefined')
	window.SkateRepository = Repository;

/**
 * Immediately dehydrates (flattens) the properties of the given object.
 * This method can be overridden for a specific repository by using skate/Database.configRepository()
 * 
 * @param {type} item
 * @see {@link module:skate/Database~Database#configRepository Database.configRepository}
 * @see {@link module:skate/Database~Database#transact Database.transact}
 * @returns {undefined}
 */
Repository.prototype.dehydrate = function(item) {};

/** 
 * Returns a promise to hydrate the properties of a given object.
 * This function is called using skate/Database.transact(), so you can request
 * repositories or other dependencies using Skate's function injection mechanism.
 * 
 * @see {@link module:skate/Database~Database#transact Database.transact} 
 * @param {type} item In addition to the standard transact services, you may also inject 'item' which is the item being hydrated
 * @returns {unresolved}
 */
Repository.prototype.hydrate = function(item) { return Promise.resolve(item); };

/**
 * Get an IndexedDB transaction (IDBTransaction) for only the store represented by 
 * this repository. The resulting transaction cannot be used to access any other store.
 * 
 * @param {Database} idb The IDBDatabase instance
 * @returns {type|IDBTransaction}
 */
Repository.prototype.getStoreTransaction = function(idb) {
	if (this.transaction)
		return this.transaction;
	return idb.transaction([this.storeName], 'readwrite');
}

/*-*
 * Return a promise to hydrate the given item by 
 * transacting this repository's .hydrate() method.
 * 
 * @private
 * @param {Database} db The {@link module:skate/Database~Database Database} instance
 * @param {object} item The item being hydrated
 */
Repository.prototype._hydrateItem = function(db, item) {
	var self = this; 
	 
	// Standard hydration
	
	var schema = db.getSchema();
	var store = schema.getStore(self.storeName);
	var foreignFields = store.getForeignFields();
	
	
	return db._transact(db, null, function(db, name, transaction) {
		return db.repository(name, transaction);
	}, self.hydrate, 'readonly', {
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
Repository.prototype._dehydrateItem = function(db, item) {
	this.dehydrate(db, item);
	
	// Standard dehydration
	
	return item;
};

/**
 * Generate a GUID which may be used as the ID for a new object.
 * @returns {String} The new GUID
 */
Repository.generateGuid = function() {
	var result, i, j;
	result = '';
	for (j = 0; j < 32; j++) {
		if (j == 8 || j == 12 || j == 16 || j == 20)
			result = result + '-';
		i = Math.floor(Math.random() * 16).toString(16).toUpperCase();
		result = result + i;
	}
	return result;
}; Repository.prototype.generateGuid = Repository.generateGuid;

/**
 * Set the transaction on this repository object so that future operations 
 * use it instead of creating a new one. This is used during skate.transact()
 * calls to ensure that a new Repository will use the newly created transaction
 * (amongst other uses).
 * 
 * @param {IDBTransaction} tx The {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction IDBTransaction} to set
 */
Repository.prototype.setTransaction = function(tx) {
	this.transaction = tx;
};

/**
 * On a transacted Repository instance, this method returns the underlying 
 * object store instance (IDBObjectStore). If called on a non-transacted 
 * Repository (ie one created with {@link module:skate/Database~Database#repository Database.repository()}),
 * this method will throw an exception.
 * 
 * @returns {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore IDBObjectStore}
 */
Repository.prototype.getStore = function() {
	if (!this.transaction) {
		throw "Cannot get object store for a non-transaction repository";
	}
	
	return 
}

/**
 * Clone the given item and then strip non-persistable fields.
 * 
 * @param {object} item The object which should be stripped
 * @returns {unresolved}
 */
Repository.prototype.stripCopy = function(item) {
	return stripCopy(item);
};

/**
 * Persist the given item into the object store.
 * Return a promise to resolve once the operation is completed.
 * 
 * @param {object} item The object which should be persisted
 * @returns {Promise} Resolves once the operation is completed.
 */
Repository.prototype.persist = function(item) {
	var self = this;
	
	// Lets make a copy and strip out all the Angular bits (ie anything prefixed with $)
	item = stripCopy(item);

	return new Promise(function(resolve, reject) {
		self.ready.then(function(db) {
			var clone = self.stripCopy(item);
			self._dehydrateItem(db, clone);
			var tx = self.getStoreTransaction(db);
			var store = tx.objectStore(self.storeName);
			new IDBRequestGenerator(store.put(clone, clone.id))
				.done(function() {
					resolve();
				}).catch(function(err) {
					reject(err);
				});
		});
	});
};

/**
 * Returns a generator which wraps the given 
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor IDBCursor}, 
 * hydrating the objects emitted using {@link module:skate/Repository~Repository#hydrate hydrate()}.
 * 
 * @param {IDBCursor} cursor The {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor IDBCursor} instance
 * @returns {Generator} A generator which will emit each of the hydrated items emitted from the given cursor
 */
Repository.prototype.hydrateCursor = function(cursor) {
	return this.hydrateGenerator(new IDBCursorGenerator(cursor));
};

/**
 * Returns a generator which wraps the given generator, hydrating 
 * the objects emitted using 
 * {@link module:skate/Repository~Repository#hydrate hydrate()}.
 * 
 * @param {Generator} generator The generator whose items should be hydrated
 * @returns {Generator} A generator which emits the hydrated items
 */
Repository.prototype.hydrateGenerator = function(generator) {
	var self = this;	
	return new Generator(function(done, reject, emit) {
		self.ready.then(function(db) {
			generator
				.emit(function(item) {
					self._hydrateItem(db, item).then(function(hydratedItem) {
						emit(hydratedItem);
					});
				});
			generator
				.done(function() {
					done();
				});
			generator
				.catch(function(err) {
					reject(err);
				});
		});
	});
};

/**
 * Promises to return a single item.
 * 
 * @param {String} id The ID of the object to fetch
 * @returns {Promise} A promise to return the item
 */
Repository.prototype.get = function(id) {
	var self = this;
	return self.ready.then(function(db) {
		return new Promise(function(resolve, reject) {
			var tx = self.getStoreTransaction(db);
			var store = tx.objectStore(self.storeName);
			self.hydrateCursor(store.get(id)).emit(function(hydratedItem) {
				resolve(hydratedItem);
			});
		});
	});
};

/**
 * Generates all items in the object store.
 * @returns {Generator}
 */
Repository.prototype.all = function() {
	var self = this;
	return new Generator(function(done, reject, emit) {
		self.ready.then(function(db) {
			var tx = self.getStoreTransaction(db);
			var store = tx.objectStore(self.storeName);
			var cursor = self.hydrateCursor(store.openCursor());
			cursor.emit(function(item) {
				emit(item);
			}).done(function() {
				done();
			});
		});
	});
};

/**
 * Retrieve an index object which allows for querying a specific index.
 * 
 * @param {String} name The name of the index to retrieve
 * @returns {Index}
 */
Repository.prototype.index = function(name) {
	var repo = this;
	return {
		name: name,
		count: function() {
			var self = this;
			
			return new Promise(function(resolve, reject) {
				repo.ready.then(function(db) {
					var tx = self.getStoreTransaction(db);
					var store = tx.objectStore(self.storeName);
					var index = store.index(self.name);
					
					new IDBRequestGenerator(index.count())
						.emit(function(count) {
							resolve(count);
						});
				});
			});
		},
		get: function(key) {
			var self = this;
			
			return new Promise(function(resolve, reject) {
				
				repo.ready.then(function(db) {
					var tx = self.getStoreTransaction(db);
					var store = tx.objectStore(self.storeName);
					var index = store.index(self.name);
					
					new IDBRequestGenerator(index.get(key))
						.emit(function(item) {
							resolve(item);
						});
				});
			});
		},
		getKey: function(key) {
			var self = this;
			
			return new Promise(function(resolve, reject) {
				
				repo.ready.then(function(db) {
					var tx = self.getStoreTransaction(db);
					var store = tx.objectStore(self.storeName);
					var index = store.index(self.name);
					
					new IDBRequestGenerator(index.getKey(key))
						.emit(function(item) {
							resolve(item);
						});
				});
			});
		},
		cursor: function(range) {
			var self = this;
			
			return new Generator(function(done, reject, emit) {
				repo.ready.then(function(db) {
					var tx = self.getStoreTransaction(db);
					var store = tx.objectStore(self.storeName);
					var index = store.index(self.name);
					
					self.hydrateCursor(index.openCursor(range))
						.emit(function(item, cancel) {
							emit(item, cancel);
						})
						.catch(function(err) {
							reject(err);
						})
						.done(function() {
							done();
						});
				});
			});
		},
		keyCursor: function(range) {
			var self = this;
			
			return new Generator(function(done, reject, emit) {
				repo.ready.then(function(db) {
					var tx = self.getStoreTransaction(db);
					var store = tx.objectStore(self.storeName);
					var index = store.index(self.name);
					
					self.hydrateCursor(index.openKeyCursor(range))
						.emit(function(item, cancel) {
							emit(item, cancel);
						})
						.catch(function(err) {
							reject(err);
						})
						.done(function() {
							done();
						});
				});
			});
		}
	};
};

/**
 * Open a cursor on the main index of this object store
 * 
 * @param {IDBKeyRange} An optional {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange IDBKeyRange} 
 *		instance specifying the range of the query
 */
Repository.prototype.cursor = function(range) {
	var self = this;
	
	return new Generator(function(done, reject, emit) {
		self.ready.then(function(db) {
			var tx = self.getStoreTransaction(db);
			var store = tx.objectStore(self.storeName);

			self.hydrateCursor(store.openCursor(range))
				.emit(function(item, cancel) {
					emit(item, cancel);
				})
				.catch(function(err) {
					reject(err);
				})
				.done(function() {
					done();
				});
		});
	});
};

/**
 * Look up many items with many keys at once.
 * Result is a generator which will emit each of the items.
 * TODO: Can we do this using cursors and key ranges?
 * 
 * @param {Array} ids An array of IDs which should be looked up
 * @returns {Generator}
 */
Repository.prototype.getMany = function(ids, includeNulls) {
	var self = this;
	
	return new Generator(function(done, reject, emit) {
		self.ready.then(function(db) {
			var tx = self.getStoreTransaction(db);
			var store = tx.objectStore(self.storeName);

			var itemPromises = [];

			for (var i = 0, max = ids.length; i < max; ++i) {
				var id = ids[i];
				!function() {
					//itemPromises.push(new Promise(function(resolve) { resolve({id: id}); }));
					itemPromises.push(new Promise(function(resolve, reject) {
						
						self.hydrateCursor(store.get(id))
							.emit(function(item) {
								emit(item);
								resolve(item);
							}).catch(function(err) {
								if (includeNulls) {
									emit(null);
								}
								resolve(null);
							});
						
					}).then(function(items) {
						return items;
					}));
				}(id);
			}
			
			Promise.all(itemPromises).then(function(items) {
				done();
			});
		});
	});
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
Repository.prototype.find = function(criteria) {
	var self = this;

	return new Generator(function(resolve, reject, emit) {
		self.ready.then(function(db) {
			var isEquivalent;
			isEquivalent = function(criteriaValue, realValue) {

				if (criteriaValue === realValue)
					return true;

				if (criteriaValue == realValue)
					return true;

				if (typeof criteriaValue == 'object') {
					var good = true;
					for (var key in criteriaValue) {
						var value = criteriaValue[key];

						if (!isEquivalent(criteriaValue[key], realValue[key])) {
							good = false;
							break;
						}
					}

					return good;
				}

				return false;
			};

			// Prepare a transaction (or use our existing one)
			// and an object store

			var tx = self.getStoreTransaction(db);
			var store = tx.objectStore(self.storeName);
			var items = null;
			var promise = Promise.resolve();

			// The first item will use an index filter.
			// Subsequent criteria will filter using Javascript.
			// 
			// We'll use promises here to ensure that each step in the loop
			// is done in sequence even if some of the loop steps complete
			// asynchronously.

			for (var fieldName in criteria) {
				!function(fieldName) {
					promise = promise.then(function() {
						var fieldValue = criteria[fieldName];

						if (items === null) {
							// Source

							if (store.indexNames.contains(fieldName)) {
								var index = store.index(fieldName);

								return new Promise(function(resolve, reject) {
									items = [];
									new IDBCursorGenerator(index.openCursor(fieldValue))
										.emit(function(item) {
											items.push(item);
										}).done(function() {
											resolve();
										});
								});


							} else {
								return new Promise(function(resolve, reject) {
									items = [];
									new IDBCursorGenerator(store.openCursor())
										.emit(function(item) {
											items.push(item);
										}).done(function() {
											resolve();
										});
								});
							}
						} else {
							// Filter

							var newItems = [];

							for (var i = 0, max = items.length; i < max; ++i) {
								var item = items[i];

								if (!isEquivalent(fieldValue, item[fieldName]))
									continue;

								newItems.push(item);
							}

							items = newItems;
						}
					});
				}(fieldName);
			};

			// Once the promise chain is finished, we'll finally resolve the
			// promise given by this method.

			promise.then(function() {
				
				// Since this implementation happens almost entirely in JS, we cannot
				// actually stream the results, so we'll emulate that for now.
				for (var i = 0, max = items.length; i < max; ++i)
					emit(items[i]);
				
				resolve();
			});
		});
	});
};

/**
 * Promises to resolve once the item has been deleted.
 * 
 * @param {String} id The ID of the object to delete
 * @returns {Promise} A promise to resolve once the item has been deleted.
 */
Repository.prototype.delete = function(id) {
	var self = this;
	return new Promise(function(resolve, reject) {
		self.ready.then(function(db) {
			var tx = self.getStoreTransaction(db);
			var store = tx.objectStore(self.storeName);
			store.delete(id);
			
			new IDBRequestGenerator(store.delete(id))
				.done(function() {
					resolve();
				});
		});
	});
};

