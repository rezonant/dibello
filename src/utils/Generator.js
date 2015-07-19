/**
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
	self._emitters = [];
	
	var onEmit = function(item) {
		var yields = self._emitters;
		for (var i = 0, max = yields.length; i < max; ++i) {
			var cb = yields[i];
			
			cb.assign();
		}
	};
	
	Promise.call(this, function(resolve, reject) {
		var items = [];
		var yields = function(item) {
			items.push(item);
			onEmit(item);
		};
		
		var subresolve = function(ret) {
			if (typeof ret !== undefined) {
				throw Generator.InvalidResolution;
			}
			
			resolve(items);
		};
		
		cb(subresolve, reject, emit);
	});
}

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

Generator.prototype = Object.create(Promise.prototype);
Generator.prototype.constructor = Generator;

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

/**
 * Register a callback for the emit event, when the streamable promise
 * emits an item.
 * 
 * @param {type} cb
 * @returns {Generator.prototype}
 */
Generator.prototype.emit = function(cb) {
	this._emitters.push(cb);
	return this;
};
