(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * WHOO
 * Streamable promises 
 * 
 * These are promises which always deliver arrays, but also support returning each individual item
 * as they are obtained in addition to all once the promise is finally resolved.
 * They are similar to ES6 generators, but are asynchronous via callbacks instead of co-routines.
 * 
 * @param {type} cb
 * @returns {Generator}
 */

function Generator(cb) {
	var self = this;
	
	self._registeredEmits = [];
	self._registeredCatches = [];
	self._registeredDones = [];
	
	var onEmit = function(item) {
		var yields = self._emitters;
		for (var i = 0, max = yields.length; i < max; ++i) {
			var cb = yields[i];
			
			cb.assign();
		}
	};
	
	var callback = function(fns, args) {
		for (var i = 0, max = fns.length; i < max; ++i) {
			fns[i].apply(null, args);
		}
	};
	
	var done = function() {
		callback(self._registeredDones, []);
	};
	
	var reject = function(error) {
		callback(self._registeredCatches, [error]);
	};
	
	var emit = function(item) {
		callback(self._registeredEmits, [item]);
	};
	
	// Unlike promises, callbacks to generator functions _must_ be asynchronous
	// to ensure anyone even has a chance to register for the first item in some cases.
	// Since this is done on a timeout, it ensures that you have until control is released
	// from your function to register emits, dones, and thens before the first item is generated.
	// Items are NOT stored after they are emitted, if you miss it you won't get it.
	
	setTimeout(function() {
		cb(done, reject, emit);
	}, 1);
}

// Integrate with the environment.

if (typeof window !== 'undefined')
	window.Generator = Generator;

if (typeof module !== 'undefined')
	module.exports = Generator;

// Errors thrown from generators

Generator.InvalidResolution = {
	error: 'streamablePromise-invalid-resolution',
	message: 'You cannot resolve() a Generator with a value. '+
			 'The value of a streamable promise is always the array of yielded items'
};
Generator.InvalidSubpromiseResolution = {
	error: 'streamablePromise-invalid-subresolution',
	message: 'While attempting to combine the results of multiple promises, '+
			 'one of the (non-streamable) promises returned an item which was not an array.'
};

// Static methods

/**
 * Union the results of the promises into a single Generator
 * 
 * @param {type} promises
 * @returns {undefined}
 */
Generator.union = function(promises) {
	return new Generator(function(resolve, reject, emit) {
		for (var i = 0, max = promises.length; i < max; ++i) {
			var promise = promises[i];

			if (promise.emit) {
				promise.emit(function(item) {
					emit(item);
				});
			} else {
				promise.then(function(items) {
					if (typeof items !== 'object' || items.length === undefined) {
						throw Generator.InvalidSubpromiseResolution;
					}
					
					for (var j = 0, jMax = items.length; j < jMax; ++j) {
						emit(items[j]);
					}
				});
			}
		}
	});
};

/**
 * Return items which occur in setA but not in setB.
 * Equality is determined via strict equals (===).
 * Pass a comparator function to override this behavior.
 * 
 * @param {type} promiseForBigSet
 * @param {type} promiseForItemsToExclude
 * @returns {undefined}
 */
Generator.exclude = function(setA, setB, comparator)
{
	if (comparator === undefined) {
		comparator = function(a, b) {
			return a === b;
		}
	}
	
	return new Generator(function(resolve, reject, emit) {
		var itemsA = [];
		var itemsB = [];

		Promise.all([
			setA.then(function(items) {
				itemsA = items;
			}),

			setB.then(function(items) {
				itemsB = items;
			})
		]).then(function() {
			for (var i = 0, max = itemsA.length; i < max; ++i) {
				var itemA = itemsA[i];
				var skip = false;

				for (var j = 0, jMax = itemsB.length; j < jMax; ++j) {
					var itemB = itemsB[j];

					if (comparator(itemA, itemB)) {
						skip = true;
						break;
					}
				}

				if (skip)
					continue;

				emit(itemA);
			}
			
			resolve();
		});
	});
}

/**
 * Intersects the given set of streamable promises, using the given "hasher" function
 * to produce an ID string for each object. This approach is much more efficient than intersecting
 * by comparison (intersectByComparison()), so this should be used instead whenever possible.
 * Efficiency: ?
 * 
 * @param {type} promises
 * @param {type} hasher
 * @returns {undefined}
 */
Generator.intersectByHash = function(promises, hasher) {
	
	return new Generator(function(resolve, reject, emit) {
		var map = {};
		var handlers = [];
		
		for (var i = 0, max = promises.length; i < max; ++i) {
			var promise = promises[i];
			
			var handleEmit = function(item) {
				var id = identify(item);
				var count = 0;
				if (map[id])
					count = map[id];
				
				count += 1;
				map[id] = count;
				
				if (count == promises.length) {
					emit(item);
				}
			}
			
			if (promise.emit) {
				handlers.push(new Promise(function(resolve, reject) {
					handlers.emit(handleEmit).then(function() {
						resolve();
					});
				}));
			} else {
				handlers.push(promise.then(function(items) {
					for (var j = 0, jMax = items.length; j < jMax; ++j) {
						handleEmit(items[j]);
					}
				}));
			}
		}
		
		Promise.all(handlers).then(function() {
			resolve();
		});
	});
}

/**
 * Intersects the given set of streamable promises, using the given "comparator" function
 * to determine if two objects are equal. This form of intersect operation can be much 
 * less efficient than intersection by identity (intersectByIdentity). Efficiency n^2
 * 
 * @param {type} promises
 * @param {type} identify
 * @returns {undefined}
 */
Generator.intersectByComparison = function(promises, comparator) {
	
	return new Generator(function(resolve, reject, emit) {
		var handlers = [];
		var distinctItems = [];
		
		for (var i = 0, max = promises.length; i < max; ++i) {
			var promise = promises[i];
			
			var handleEmit = function(item) {
				var found = false;
				
				for (var j = 0, jMax = distinctItems.length; j < jMax; ++j) {
					var distinctItem = distinctItems[j];
					
					if (comparator(distinctItem.item, item)) {
						distinctItem.count += 1;
						
						if (!distinctItem.emitted && distinctItem.count == promises.length) {
							distinctItem.emitted = true;
							emit(distinctItem.item);
						}
						
						found = true;
						break;
					}
				}
				
				if (found)
					return;
				
				var distinctItem = {
					item: item,
					count: 1,
					emitted: false
				};
				
				if (distinctItem.count == promises.length) {
					emit(distinctItem.item);
					distinctItem.emitted = true;
				}
				
				distinctItems.push(distinctItem);
			}
			
			if (promise.emit) {
				handlers.push(new Promise(function(resolve, reject) {
					promise.emit(handleEmit).then(function() {
						resolve();
					});
				}));
			} else {
				handlers.push(promise.then(function(items) {
					for (var j = 0, jMax = items.length; j < jMax; ++j) {
						handleEmit(items[j]);
					}
				}));
			}
		}
		
		Promise.all(handlers).then(function() {
			resolve();
		});
	});
}

// Instance methods

/**
 * Register a callback for the emit event, when the streamable promise
 * emits an item.
 * 
 * @param {type} cb
 * @returns {Generator.prototype}
 */
Generator.prototype.emit = function(cb) {
	this._registeredEmits.push(cb);
	return this;
};

Generator.prototype.catch = function(cb) {
	this._registeredCatches.push(cb);
	return this;
};

Generator.prototype.done = function(cb) {
	this._registeredDones.push(cb);
	return this;
};

/**
 * To blend nicely with Promises, Generators can start an actual Promise chain.
 * NOTE that this will cause the Generator to store an array of all results emitted 
 * between the registration of this function and when the generator complets (.done()).
 * 
 * This will cause O(N) memory instead of O(1), so only use this if you don't mind storing
 * all generator results into an array (very very bad idea for an infinite set).
 * 
 * @param {type} cb
 * @returns {Promise}
 */
Generator.prototype.then = function(cb) {
	var self = this;
	return new Promise(function(resolve, reject) {
		var items = [];
		
		self.emit(function(item) {
			items.push(item);
		}).done(function() {
			try {
				var result = cb(items);
				resolve(result);
			} catch (e) {
				reject(e);
			}
		});
	});
};

},{}],2:[function(require,module,exports){
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
},{"./stripCopy.js":13,"es5generators":1}],3:[function(require,module,exports){
/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 * SchemaBuilder class
 * 
 */

function SchemaBuilder() {
	this.stores = [];
}; module.exports = SchemaBuilder;

var transact = require('./transact.js');

/**
 * Pass in a version change transaction so that we can modify the schema.
 * Without it, no run blocks are run and no changes made to the schema are 
 * applied (they are only modeled for analysis later).
 */
SchemaBuilder.prototype.setDatabase = function(db, transaction) {
	
	this.db = db;
	this.transaction = transaction;
};

/**
 * Disable modifications of the schema via an existing version change transaction (if any).
 */
SchemaBuilder.prototype.disconnectDatabase = function() {
	this.transaction = null;
	this.db = null;
};

// SchemaBuilder

/**
 * Create a new store
 * 
 * @param {type} name
 * @returns {StoreBuilder}
 */
SchemaBuilder.prototype.createStore = function(name) {
	if (this.stores[name]) {
		throw {
			error: 'StoreAlreadyExists',
			message: 'A store with name \''+name+'\' already exists.'
		};
	}
	return new StoreBuilder(this, name);
};

/**
 * Get an existing store so that you can modify it.
 * 
 * @param {type} name
 * @returns {Array}
 */
SchemaBuilder.prototype.getStore = function(name) {
	if (!this.stores[name]) {
		throw {
			error: 'NoSuchStore',
			message: 'A store with name \''+name+'\' could not be found.'
		};
	}
	
	return this.stores[name];
};

/**
 * Migrate data imperatively. Only calls back if a migration is in progress.
 * 
 * @param {type} callback
 * @returns {SchemaBuilder.prototype}
 */
SchemaBuilder.prototype.run = function(callback) {
	if (this.transaction && this.db) {
		var metadata = annotateFn(callback);
		var fn = metadata.fn;
		var params = metadata.params;
		var self = this;
		
		transact(this.db, this.transaction, fn, 'readwrite');
	}
	return this;
};

},{"./transact.js":14}],4:[function(require,module,exports){
/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 */

function StoreBuilder(builder, name, id) {
	this.builder = builder;
	this.store = {
		primaryKey: id,
		name: name,
		fields: [],
	};
	
	if (builder) {
		this.builder.stores[name] = this;
		if (this.builder.transaction && this.builder.db) {
			  this.store.realized = this.builder.db.createObjectStore(name, { keyPath: id });
		}
		
	}
}; module.exports = StoreBuilder;

StoreBuilder.prototype.run = function(callback) {
	if (this.builder)
		return this.builder.run(callback);
};

StoreBuilder.prototype.createStore = function(name) {
	if (!this.builder) {
		throw {
			type: 'NoBuilderToCreateStoreOn',
			message: 'Cannot start a new store definition without an attached SchemaBuilder (storeBuilder.store())'
		};
	}
	
	return this.builder.createStore(name);
};

StoreBuilder.prototype.getStore = function(name) {
	if (!this.builder) {
		throw {
			type: 'NoBuilderToGetStoreOn',
			message: 'Cannot start a new store definition without an attached SchemaBuilder (storeBuilder.store())'
		};
	}
	
	return this.builder.getStore(name);
};

StoreBuilder.prototype.key = function(name) {
	this.addField(name, {key: true, index: name, name: name, unique: false});
	return this;
};

StoreBuilder.prototype.field = function(name) {
	this.addField(name, {key: false, index: name, name: name, unique: false});
	return this;
};

StoreBuilder.prototype.addField = function(name, data) {
	if (this.store.fields[name]) {
		throw {
			error: 'FieldAlreadyExists',
			message: 'The field '+name+' already exists'
		};
	}
	
	this.store.fields[name] = data;
	
	// If we're live, then do it!
	
	if (data.key && this.builder && this.builder.transaction) {
		if (!this.store.realized)
			this.store.realized = this.builder.transaction.objectStore(this.store.name);
		
		this.store.realized.createIndex(data.index, data.name, {unique: data.unique});
	}
	
	return this;
};

StoreBuilder.prototype.remove = function(name) {
	this.removeField(name);
	return this;
}

StoreBuilder.prototype.removeField = function(name) {
	delete this.store.fields[name];
	
	if (this.builder && this.builder.transaction) {
		if (!this.store.realized)
			this.store.realized = this.builder.transaction.objectStore(this.name);
		this.store.realized.deleteIndex(name);
	}
	
	return this;
}

StoreBuilder.prototype.id = function(name) {
	this.addField(name, {key: true, index: name, name: name, unique: true});
	return this;
};

StoreBuilder.prototype.foreign = function(name, ref) {
	this.addField(name, {key: true, index: name, name: name, unique: false, references: ref});
	return this;
};

StoreBuilder.prototype.unique = function(name) {
	this.addField(name, {key: true, index: name, name: name, unique: true});
	return this;
};

},{}],5:[function(require,module,exports){
/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 */

window.Array.prototype.yield = function(cb) {
	for (var i = 0, max = this.length; i < max; ++i) {
		var ret = cb(this[i]);
		if (typeof ret === 'undefined')
			ret = true;
		
		if (!ret)
			return;
	}
};

},{}],6:[function(require,module,exports){

window.IDBCursor.prototype.hydrate = function(hydrator) {
	var self = this;

	var hydrationCursor = {
		yields: [],
		finishers: [],
		catchers: [],
		
		yield: function(cb) {
			this.yields.push(cb);
		},
		finishes: function(cb) {
			this.finishers.push(cb);
		},
		catch: function(cb) {
			this.catchers.push(cb);
		}
	};

	var uponCatch = function(err) {
		var catchers = hydrationCursor.yields;
		for (var i = 0, max = yields.length; i < max; ++i) {
			catchers[i].apply(hydrationCursor, [err]);
		}
	};

	var uponYield = function(item) {
		var yields = hydrationCursor.yields;
		for (var i = 0, max = yields.length; i < max; ++i) {
			yields[i].apply(hydrationCursor, [item]);
		}
	};
	
	var uponFinish = function(items) {
		var finishers = hydrationCursor.finishers;
		for (var i = 0, max = finishers.length; i < max; ++i) {
			finishers[i].apply(hydrationCursor, [items]);
		}
	};

	var result;
	
	this
		.yield(function(item) {
			hydrator(item).then(function(hydratedItem) {
				result.push(hydratedItem);
				uponYield(hydratedItem);
			});
		})
		.finishes(function(value) {
			uponFinish(result);
			})
		.catch(function(err) {
			uponCatch(err);
		});
		
	return hydrationCursor;
};

},{}],7:[function(require,module,exports){

var transact = require('../transact.js');

/**
 * Lose the boilerplate clutter in your IndexedDB transactions using Skate's 
 * injection-driven transaction API.
 * 
 * Simply call transact, passing a function with parameters that specify what 
 * repositories are desired, and optionally an IndexedDB transaction mode ('readonly', 'readwrite')
 * 
 * Some additional non-object-store parameters may be used: 'db' (the IDBDatabase instance), 'transaction' (the IDBTransaction instance)
 * The transaction will be created specifying ONLY the object stores you requested, so attempting
 * to get additional object stores later will not work.
 * 
 * For that you must start a new transaction, which you can do with db.transact() from within the
 * callback.
 * 
 * @param {type} fn
 * @param {type} mode
 * @returns {undefined}
 */
window.IDBDatabase.prototype.transact = function(fn, mode) {
	return transact(this, null, fn, mode);
};
},{"../transact.js":14}],8:[function(require,module,exports){

window.IDBObjectStore.prototype.generateGuid = function() {
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

window.IDBObjectStore.prototype.all = function(offset, limit) {
	var self = this;
	
	return new Promise(function(resolve, reject) {
		var results = [];
		var count = 0;
		var resolved = false;
		self.openCursor()
			.yield(function(value) {
				results.push(value);
				if (++count >= limit)
					return false;
			})
			.finishes(function() {
				resolve(results);
			})
			.catch(function(err) {
				console.log(err);
				debugger;
				reject(err);
			});
		
	});
};

},{}],9:[function(require,module,exports){
/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 */

window.IDBRequest.prototype.finishes = function(cb) {
	this.__skate_onfinish = cb;
	return this;
};

window.IDBRequest.prototype.yield = function(cb) {
	this.onsuccess = function(ev) {
		var cursor = ev.target.result;
		
		if (!cursor) {
			
			// Ending naturally
			
			if (this.__skate_onfinish) {
				this.__skate_onfinish();
			}
			
			return;
		}
		
		var ret = cb(cursor.value);
		if (typeof ret === 'undefined')
			ret = true;
		
		if (ret) {
			cursor.continue();
		} else {
			
			// Ending early
			
			if (this.__skate_onfinish) {
				this.__skate_onfinish();
				return;
			}
		}
	};
	
	return this;
};

window.IDBRequest.prototype.succeeds = function(cb) {
	this.onsuccess = cb;
	return this;
};

window.IDBRequest.prototype.catch = function(cb) {
	this.onerror = cb;
	return this;
};

},{}],10:[function(require,module,exports){
/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 */

window.Promise.prototype.debug = function() {
	console.log('Waiting for promise to resolve...');
	this.then(function(value) {
		console.log('Promise resolved with the value:');
		console.log(value);
	}).catch(function(err) {
		console.log('Promise rejected with error:');
		console.log(err);
	});
};
window.Promise.prototype.yield = function(cb) {
	this.then(function(result) {
		if (result.length) {
			result.yield(cb);
			return;
		}
		
		cb(result);
	});
};



},{}],11:[function(require,module,exports){

// Standardize any prefixed implementations of IndexedDB



if (typeof window !== 'undefined') {
	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
	window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
}
},{}],12:[function(require,module,exports){
/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 */


require('./idbStandardize.js');

var SchemaBuilder = require('./SchemaBuilder.js');
var StoreBuilder = require('./StoreBuilder.js');
var Repository = require('./Repository.js');

require('./extensions/IDBObjectStore.js');
require('./extensions/IDBRequest.js');
require('./extensions/Array.js');
require('./extensions/Promise.js');
require('./extensions/IDBCursor.js');
require('./extensions/IDBDatabase.js');

// API

var skate = {
	version: '0.1',
	
	/**
	 * Exported classes
	 */
	classes: {
		Repository: Repository,
		SchemaBuilder: SchemaBuilder,
		StoreBuilder: StoreBuilder
	},
	
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
	 *						apples.all().yield(function(apple) {
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
	 *			}).yield(function(apple) {
	 *				console.log('Found a large apple!', apple);
	 *			});
	 *		})
	 * });
	 * 
	 * @param string dbName
	 * @param {} options
	 * @returns {Promise|skate.open.ready}
	 */
	open: function(indexedDB, dbName, options) {
		
		// Process options
		
		var version = 1;
		if (options.version)
			version = options.version;
		
		var item = {
			name: dbName,
			options: options,
			ready: null,
		};
		
		// Ready promise
		
		var resolveReady;
		var rejectReady;
		var ready = new Promise(function(resolve, reject) {
			resolveReady = resolve;
			rejectReady = reject;
		});
		
		var schema = new SchemaBuilder();
	
		// Open DB request
		
		var DBOpenRequest = indexedDB.open(dbName, version);

		// these two event handlers act on the database being opened successfully, or not
		DBOpenRequest.onerror = function (event) {
			rejectReady();
		};

		DBOpenRequest.onsuccess = function (event) {
			resolveReady(DBOpenRequest.result);
		};

		// Construct the final schema

		// This event handles the event whereby a new version of the database needs to be created
		// Either one has not been created before, or a new version number has been submitted via the
		// window.indexedDB.open line above
		//it is only implemented in recent browsers
		DBOpenRequest.onupgradeneeded = function (event) {
			var db = event.target.result;
			var oldVersion = event.oldVersion;
			var newVersion = event.newVersion;
			
			console.log('[dijest-data] Schema update required from '+oldVersion+' to '+newVersion);

			console.log('[dijest-data] Loading schema history...');
			for (var version = 1; version <= oldVersion; ++version) {
				console.log(' - Loading schema version #'+version+' (model-only)');
				options.migrations[version](schema);
			}
			
			schema.setDatabase(db, event.currentTarget.transaction);
			db.onerror = function (event) {
				console.error('[dijest-data] Error while building database schema');
				console.log(event);
			};

			console.log('Applying migrations...');
			for (var version = oldVersion+1; version <= newVersion; ++version) {
				console.log(' - Applying schema version #'+version+' (live)');
				options.migrations[version](schema);
			}
			
			schema.disconnectDatabase();
			console.log('Schema updated successfully.');

			db.onerror = null;
		};
		
		return ready;
	}
}; module.exports = skate;

},{"./Repository.js":2,"./SchemaBuilder.js":3,"./StoreBuilder.js":4,"./extensions/Array.js":5,"./extensions/IDBCursor.js":6,"./extensions/IDBDatabase.js":7,"./extensions/IDBObjectStore.js":8,"./extensions/IDBRequest.js":9,"./extensions/Promise.js":10,"./idbStandardize.js":11}],13:[function(require,module,exports){

function strip(obj) {
	if (obj === null)
		return;

	if (typeof obj !== 'object')
		return;

	if (obj.length) {
		for (var i = 0, max = obj.length; i < max; ++i) {
			strip(obj[i]);
		}
	} else {
		for (var key in obj) {
			if (key == '') continue;
			if (key[0] == '$')
				delete obj[key];
			else
				strip(obj[key]);
		}
	}
};

function stripCopy(obj) {
	var copy = angular.copy(obj);
	strip(obj);
	return obj;
};

module.exports = stripCopy;
},{}],14:[function(require,module,exports){
/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 * Common implementation of transact()
 * 
 */

var annotateFn = require('./utils/annotateFn.js');
var injector = require('./utils/lightinjector.js');
var Repository = require('./Repository.js');

function SkateUnknownStoreException(message) {
	this.message = message;
};

/**
 * Calls a function, injecting the proper repositories and related services (db, transaction),
 * for the given transaction (or the transaction created by a factory function).
 * If no transaction is passed, one is automatically created based on the repositories requested
 * by the given function.
 * 
 * @param {type} fn
 * @param {type} mode
 * @returns {undefined}
 */
function transact(db, transactionOrFactory, fn, mode) {
	var mode = mode || 'readonly';
	
	// Use LightInjector to inject the parameters dynamically.
	// We'll use this to map in the database, a transaction,
	// and repositories for any specifically named object stores.
	
	injector({
		db: db,
		
		/**
		 * Traverse through the parameters given and decorate the map
		 * such that any needed repositories are available when the injector
		 * later maps parameters to injection assets.
		 * 
		 * @param {Array} params
		 * @returns
		 */
		$populate: function(params) {
			var storeNames = [];
			for (var i = 0, max = params.length; i < max; ++i) {
				if (params[i] == 'db')
					continue;

				storeNames.push(params[i]);
			}

			if (transactionOrFactory == null) {
				this.transaction = db.transaction(storeNames, mode);
			} else if (typeof transactionOrFactory === 'function') {
				this.transaction = transactionOrFactory(storeNames, mode);
			} else {
				this.transaction = transactionOrFactory;
			}
			
			var hydratedParams = [];
			for (var i = 0, max = params.length; i < max; ++i) {
				var param = params[i];
				
				// Skip predefined stuff
				if (this[param])
					continue;
				
				var storeOnly = false;
				
				if (param.indexOf('store:') == 0) {
					storeOnly = true;
					param = param.replace(/^store:/, '');
				}
				
				var store;
				try {
					store = tx.objectStore(param);
				} catch (e) {
					throw new SkateUnknownStoreException('No such object store '+param);
				}
				
				if (storeOnly)
					this[param] = store;
				else
					this[param] = new Repository(db, store);
			}
		}
	}, null, fn);
};

module.exports = transact;
},{"./Repository.js":2,"./utils/annotateFn.js":15,"./utils/lightinjector.js":16}],15:[function(require,module,exports){
/**
 * 
 * / ANNOTATEFN
 * /
 * / AUTHOR: William Lahti
 * / (C) 2015 William Lahti
 *
 * A light-weight Javascript function reflector, similar to the one found in Angular.js.
 * Also supports array-style annotations for mangler-friendly code.
 *
 */


var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function annotateFn(fn) {

	if (typeof fn === 'object' && fn.length !== undefined) {
		var params = fn;
		fn = params[params.length - 1];
		params.pop();

		return {
			fn: fn,
			params: params
		};
	}

	var $params;
	if (!($params = fn.$params)) {
		$params = [];
		var fnText = fn.toString().replace(STRIP_COMMENTS, '');
		var argDecl = fnText.match(FN_ARGS);
		var parts = argDecl[1].split(FN_ARG_SPLIT);

		for (var i = 0, max = parts.length; i < max; ++i) {
			var arg = parts[i];
			arg.replace(FN_ARG, function(all, underscore, name) {
				$params.push(name);
			});
		}

		fn.$params = $params;
	}

	return {
		fn: fn,
		params: fn.$params
	};
}; module.exports = annotateFn;
},{}],16:[function(require,module,exports){
/**
 * 
 * / LIGHTINJECTOR
 * /
 * / AUTHOR: William Lahti
 * / (C) 2015 William Lahti
 *
 * A light-weight function dependency injector, similar to the one found in Angular.js
 *
 */

var annotateFn = require('./annotateFn.js');

function InjectionException(message) {
	this.error = 'inject-error';
	this.message = message;
}

/**
 * Calls the given function, passing parameters to said function which have
 * names which match entries in the given map. 
 * 
 * @param {} map
 * @param {} self
 * @param function fn
 * @returns mixed The result of the function once called
 */
function inject(map, self, fn) {
	var meta = annotateFn(fn);
	var params = meta.params;
	fn = meta.fn;
	
	var args = [];
	
	if (map.$populate) {
		map.$populate(params);
	}
	
	for (var i = 0, max = params.length; i < max; ++i) {
		var param = params[i];
		var factory = map[param];
		
		if (typeof factory === 'undefined') {
			
			if (map.$any) {
				factory = map.$any;
			} else {
				throw new InjectionException('No service factory for injected parameter '+param+' (Parameter must be a valid service)');
			}	
		}
		
		args.push(factory(inject));
	}
	
	return fn.apply(self, args);
}

inject.InjectionException = InjectionException;
module.exports = inject;
},{"./annotateFn.js":15}]},{},[12]);
