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

function Repository(db, storeName) {
	var self = this;
	
	if (db instanceof Promise) {
		this.ready = db;
	} else {
		this.ready = Promise.resolve(db);
	}
	
	this.storeName = storeName;
	this.transaction = null;
	
}; module.exports = Repository;

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

Repository.prototype.persist = function(item) {
	var self = this;
	
	// Lets make a copy and strip out all the Angular bits (ie anything prefixed with $)
	item = stripcopy(item);

	return new Promise(function(resolve, reject) {
		var clone = $.extend({}, story);

		delete clone.$$hashKey;

		var taskIDs = [];
		if (clone.tasks) {
			for (var i = 0, max = clone.tasks.length; i < max; ++i)
				taskIDs.push(clone.tasks[i].id);
			delete clone.tasks;
		}
		clone.taskIDs = taskIDs;

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
	
	return self.ready.then(function(db) {
		return new Promise(function(resolve, reject) {
			var tx = self.getStoreTransaction(db);
			var store = tx.objectStore(self.storeName);
			
			resolve(store.openCursor());
			/**
			var items = [];
			store.openCursor().yield(function(item) {
				items.push(item);
			}).finishes(function() {
				resolve(items);
			});
			**/
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
	
	return new StreamablePromise(function(resolve, reject, emit) {
		self.ready.then(function(db) {
			var tx = self.getStoreTransaction(db);
			var store = tx.objectStore(self.storeName);

			var itemPromises = [];
			var items = [];

			for (var i = 0, max = ids.length; i < max; ++i) {
				var id = ids[i];
				!function() {
					itemPromises.push(new Promise(function(resolve, reject) {
						store.get(id).yield(function(item) {
							items.push(item);
							emit(item);
							resolve(item);
						}).catch(function(err) {
							if (includeNulls) {
								items.push(null);
								emit(null);
							}
							resolve(null);
						});
					}));
				}(id);
			}

			Promise.all(itemPromises).then(function() {
				resolve();
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

	return new StreamablePromise(function(resolve, reject, emit) {
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