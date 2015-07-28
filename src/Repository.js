/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 * Repository class
 * 
 */

var stripCopy = require('./stripCopy.js');
var Generator = require('es5-generators');
var IDBRequestGenerator = require('./IDBRequestGenerator.js');
var IDBCursorGenerator = require('./IDBCursorGenerator.js');

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

Repository.prototype.dehydrate = function(item) {};
Repository.prototype.hydrate = function(item) { return Promise.resolve(item); };

Repository.prototype.getStoreTransaction = function(db) {
	if (this.transaction)
		return this.transaction;
	return db.transaction([this.storeName], 'readwrite');
}

if (window)
	window.SkateRepository = Repository;

Repository.prototype._hydrateItem = function(db, item) {
	var self = this;
	return db._transact(db, null, function(db, name, transaction) {
		return db.repository(name, transaction);
	}, self.hydrate, 'readonly', {
		item: item
	});
};

Repository.prototype._dehydrateItem = function(db, item) {
	this.dehydrate(db, item);
	
	// Standard dehydration
	
	return item;
};
 
Repository.prototype.generateGuid = function() {
	var result, i, j;
	result = '';
	for (j = 0; j < 32; j++) {
		if (j == 8 || j == 12 || j == 16 || j == 20)
			result = result + '-';
		i = Math.floor(Math.random() * 16).toString(16).toUpperCase();
		result = result + i;
	}
	return result;
};

Repository.generateGuid = Repository.prototype.generateGuid();

/**
 * Set the transaction on this repository object so that future operations 
 * use it instead of creating a new one. This is used during skate.transact()
 * calls to ensure that a new Repository will use the newly created transaction
 * (amongst other uses).
 * 
 * @param {IDBTransaction} tx
 */
Repository.prototype.setTransaction = function(tx) {
	this.transaction = tx;
};

Repository.prototype.getStore = function() {
	if (!this.transaction) {
		throw "Cannot get object store for a non-transaction repository";
	}
}

/**
 * Clone the given item and then strip non-persistable fields.
 * 
 * @param {type} item
 * @returns {unresolved}
 */
Repository.prototype.stripCopy = function(item) {
	return stripCopy(item);
};

/**
 * Persist the given item into the object store.
 * Return a promise to resolve once the operation is completed.
 * 
 * @param {object} item
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

Repository.prototype.hydrateCursor = function(cursor) {
	return this.hydrateGenerator(new IDBCursorGenerator(cursor));
};

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
 * @param {type} id
 * @returns {unresolved}
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
 * @param {type} name
 * @returns {undefined}
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
 * @param {type} ids
 * @returns {unresolved}
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
 * @param {type} criteria
 * @returns {unresolved}
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
 * @param {type} id
 * @returns {undefined}
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

