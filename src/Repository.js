/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 * Repository class
 * 
 */

var stripCopy = require('./stripCopy.js');
var Generator = require('es5generators');

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

Repository.prototype.dehydrate = function() {};
Repository.prototype.hydrate = function() {};

Repository.prototype.getStoreTransaction = function(db) {
	if (this.transaction)
		return this.transaction;
	return db.transaction([this.storeName], 'readwrite');
}

if (window)
	window.SkateRepository = Repository;

Repository.prototype.setTransaction = function(tx) {
	this.transaction = tx;
};

Repository.prototype.stripCopy = function(item) {
	return stripCopy(item);
};

Repository.prototype.persist = function(item) {
	var self = this;
	
	// Lets make a copy and strip out all the Angular bits (ie anything prefixed with $)
	item = stripCopy(item);

	return new Promise(function(resolve, reject) {
		var clone = self.stripCopy(item);
		self.dehydrate(clone);
		self.ready.then(function(db) {
			var tx = self.getStoreTransaction(db);
			var store = tx.objectStore(self.storeName);

			store.put(clone, clone.id).succeeds(function() {
				resolve();
			}).catch(function(err) {
				reject(err);
			});
		});
	});
};

Repository.prototype.get = function(id) {
	var self = this;
	return self.ready.then(function(db) {
		return new Promise(function(resolve, reject) {
			var tx = self.getStoreTransaction(db);
			var store = tx.objectStore(self.storeName);
			
			store.get(id).yield(function(item) {
				resolve(item);
			});
		});
	});
};

Repository.prototype.all = function() {
	var self = this;
	return new Generator(function(done, reject, emit) {
		self.ready.then(function(db) {
			var tx = self.getStoreTransaction(db);
			var store = tx.objectStore(self.storeName);

			store.openCursor().yield(function(item) {
				emit(item);
			}).finishes(function() {
				done();
			});
		});
	});
};

/**
 * Get many keys in one swoop
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
						
						//store.foo(function() { resolve({}); }); return;
						var originalResolve = resolve;
						store.get(id).yield(function(item) {
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

									index.openCursor(fieldValue).yield(function(item) {
										items.push(item);
									}).finishes(function() {
										resolve();
									});
								});


							} else {
								return new Promise(function(resolve, reject) {
									items = [];

									store.openCursor().yield(function(item) {
										items.push(item);
									}).finishes(function() {
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

Repository.prototype.delete = function(id) {

};