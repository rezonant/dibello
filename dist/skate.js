(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,Buffer){
/*!
 * @license deepcopy.js Copyright(c) 2013 sasa+1
 * https://github.com/sasaplus1/deepcopy.js
 * Released under the MIT license.
 */


/**
 * export to AMD/CommonJS/global.
 *
 * @param {Object} global global object.
 * @param {Function} factory factory method.
 */
(function(global, factory) {
  'use strict';

  if (typeof define === 'function' && !!define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    global.deepcopy = factory();
  }
}(this, function() {
  'use strict';

  var isNode, util, isBuffer, getKeys, getSymbols, indexOfArray;

  // is node.js/io.js?
  isNode = (typeof process !== 'undefined' && typeof require !== 'undefined');

  // fallback util module for browser.
  util = (isNode) ? require('util') : (function() {
    function isArray(value) {
      return (typeof value === 'object' &&
          Object.prototype.toString.call(value) === '[object Array]');
    }

    function isDate(value) {
      return (typeof value === 'object' &&
          Object.prototype.toString.call(value) === '[object Date]');
    }

    function isRegExp(value) {
      return (typeof value === 'object' &&
          Object.prototype.toString.call(value) === '[object RegExp]');
    }

    function isSymbol(value) {
      return (typeof value === 'symbol');
    }

    return {
      isArray: (typeof Array.isArray === 'function') ?
          function(obj) {
            return Array.isArray(obj);
          } : isArray,
      isDate: isDate,
      isRegExp: isRegExp,
      isSymbol: (typeof Symbol === 'function') ?
          isSymbol :
          function() {
            // always return false when Symbol is not supported.
            return false;
          }
    };
  }());

  // fallback Buffer.isBuffer
  isBuffer = (isNode) ?
      function(obj) {
        return Buffer.isBuffer(obj);
      } :
      function() {
        // if browser, always return false
        return false;
      };

  // fallback Object.keys for old browsers.
  getKeys = (typeof Object.keys === 'function') ?
      function(obj) {
        return Object.keys(obj);
      } :
      function(obj) {
        var keys = [],
            key;

        if (obj === null || typeof obj !== 'object') {
          throw new TypeError('obj is not an Object');
        }

        for (key in obj) {
          obj.hasOwnProperty(key) && keys.push(key);
        }

        return keys;
      };

  // get symbols in object.
  getSymbols = (typeof Symbol === 'function') ?
      function(obj) {
        return Object.getOwnPropertySymbols(obj);
      } :
      function() {
        // always return empty array when Symbol is not supported.
        return [];
      };

  // fallback Array#indexOf for old browsers.
  indexOfArray = (typeof Array.prototype.indexOf === 'function') ?
      function(array, searchElement) {
        return array.indexOf(searchElement);
      } :
      function(array, searchElement) {
        var i, len;

        if (!util.isArray(array)) {
          throw new TypeError('array is not an Array');
        }

        for (i = 0, len = array.length; i < len; ++i) {
          if (array[i] === searchElement) {
            return i;
          }
        }

        return -1;
      };

  /**
   * recursive deep copy for value.
   *
   * @private
   * @param {*} value copy target.
   * @param {*} clone
   * @param {Array} visited
   * @param {Array} reference
   * @return {*} copied value.
   */
  function copyValue_(value, clone, visited, reference) {
    var str, pos, buf, keys, i, len, key, val, idx, obj, ref;

    // number, string, boolean, null, undefined, function and symbol.
    if (value === null || typeof value !== 'object') {
      return value;
    }

    // Date.
    if (util.isDate(value)) {
      // Firefox need to convert to Number
      //
      // Firefox:
      //   var date = new Date;
      //   +date;            // 1420909365967
      //   +new Date(date);  // 1420909365000
      //   +new Date(+date); // 1420909365967
      // Chrome:
      //   var date = new Date;
      //   +date;            // 1420909757913
      //   +new Date(date);  // 1420909757913
      //   +new Date(+date); // 1420909757913
      return new Date(+value);
    }

    // RegExp.
    if (util.isRegExp(value)) {
      // Chrome, Safari:
      //   (new RegExp).source => "(?:)"
      // Firefox:
      //   (new RegExp).source => ""
      // Chrome, Safari, Firefox
      //   String(new RegExp) => "/(?:)/"
      str = String(value);
      pos = str.lastIndexOf('/');

      return new RegExp(str.slice(1, pos), str.slice(pos + 1));
    }

    // Buffer, node.js only.
    if (isBuffer(value)) {
      buf = new Buffer(value.length);
      value.copy(buf);

      return buf;
    }

    // Object or Array.
    keys = getKeys(value).concat(getSymbols(value));

    for (i = 0, len = keys.length; i < len; ++i) {
      key = keys[i];
      val = value[key];

      if (val !== null && typeof val === 'object') {
        idx = indexOfArray(visited, val);

        if (idx === -1) {
          // not circular reference
          obj = (util.isArray(val)) ? [] : {};

          visited.push(val);
          reference.push(obj);
        } else {
          // circular reference
          ref = reference[idx];
        }
      }

      clone[key] = ref || copyValue_(val, obj, visited, reference);
    }

    return clone;
  }

  /**
   * deep copy for value.
   *
   * @param {*} value copy target.
   */
  function deepcopy(value) {
    var clone = (util.isArray(value)) ? [] : {},
        visited = [value],
        reference = [clone];

    return copyValue_(value, clone, visited, reference);
  }

  return deepcopy;
}));

}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":8,"buffer":3,"util":10}],2:[function(require,module,exports){
/**
 * Generators in an ES5-style. A sort of streamable promise.
 * 
 * These are promises which always deliver many results, but also support returning each 
 * individual item as they are obtained in addition to all once the promise is finally resolved.
 * They are similar to ES6 generators, but are asynchronous via callbacks instead of co-routines.
 * 
 * These have limited support for ES6 generators as well -- You can pass an ES6 generator instance 
 * or generator function (as long as it takes no arguments) into the Generator constructor and then
 * can use the ES5-style API.
 * 
 * The reverse (using ES5 generators as ES6 generators when running ES6) is not currently possible, 
 * though if a good way to implement it is found, it may be added later. This is unlikely though.
 * 
 * @param function(done,reject,emit)|function* cb
 * @returns {Generator}
 */
function Generator(cb) {
	
	
	var self = this;
	
	self._registeredEmits = [];
	self._registeredCatches = [];
	self._registeredDones = [];
	
	var callback = function(fns, args) {
		for (var i = 0, max = fns.length; i < max; ++i) {
			fns[i].apply(null, args);
		}
	};
	
	var done = function() {
		setTimeout(function() {
			callback(self._registeredDones, []);
		}, 1);
	};
	
	var reject = function(error) {
		setTimeout(function() {
			callback(self._registeredCatches, [error]);
		}, 1);
	};
	
	var emit = function(item, cancel) {
		setTimeout(function() {
			callback(self._registeredEmits, [item, cancel]);
		}, 1);
	};
	
	// Can't iterate over a generator function, only
	// a generator instance. Start the generator, assuming 
	// it takes no arguments as there is no other option.
	// We'll act as if that instance was passed in.

	if (cb.constructor.name == 'GeneratorFunction') {
		cb = cb();
	}

	// We can wrap ES6 generators too.

	if (cb.constructor.name == 'GeneratorFunctionPrototype') {
		var item;
		var cancelled = false;
		
		while (!cancelled && !(item = cb.next()).done) {
			emit(item.value, function() {
				cancelled = true;
			});
		}
		done();

		return;
	} 

	// We can wrap arrays

	if (cb.constructor.name == 'Array') { 
		var items = cb;
		var position = 0;
		var cancelled = false;
		for (var i = 0, max = items.length; i < max; ++i) {
			emit(items[i], function() {
				cancelled = true;
			});
		}

		done();

		return;
	}

	// We can wrap promises

	if (cb.constructor.name == 'Promise') {
		cb.then(function(result) {
			emit(result, function() { });
			done();
		});
		return;
	}

	// Standard ES5 route.

	cb(done, reject, emit);
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
			 'The Promise value of a generator is always an array of yielded items'
};
Generator.InvalidSubpromiseResolution = {
	error: 'streamablePromise-invalid-subresolution',
	message: 'While attempting to combine the results of multiple promises, '+
			 'one of the promises returned an item which was not an array.'
};

// Static methods

/**
 * Create a generator to emit a single value as given.
 * @param {type} value
 * @returns {Generator}
 */
Generator.resolve = function(value) {
	return new Generator(function(done, reject, emit) {
		emit(value);
		done();
	});
}
	
/**
 * Create a generator which emits for each item of the promise's array result.
 * If the promise does not provide an array, this will break.
 */
Generator.splitPromise = function(promise) {
	return new Generator(function(done, reject, emit) {
		promise.then(function(result) {
			for (var i = 0, max = result.length; i < max; ++i)
				emit(result[i]);
			done();
		});
	});
};

/**
 * Union the results of the given generators into a single generator
 * 
 * @param {type} promises
 * @returns {undefined}
 */
Generator.union = function(generators) {
	return new Generator(function(done, reject, emit) {
		var promises = [];
		
		for (var i = 0, max = generators.length; i < max; ++i) {
			var generator = generators[i];

			if (generator.emit) {
				generator.emit(function(item) {
					emit(item);
				});
				
				promises.push(generator.done());
				
			} else {
				Console.log('WARNING: Passing promises directly to Generator.union() is deprecated. Please wrap the promise in a Generator first.');
				
				promises.push(generator.then(function(items) {
					if (typeof items !== 'object' || items.length === undefined) {
						throw Generator.InvalidSubpromiseResolution;
					}
					
					for (var j = 0, jMax = items.length; j < jMax; ++j) {
						emit(items[j]);
					}
				}));
			}
		}
		
		Promise.all(promises).then(function() {
			done();
		});
		
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
 * Intersects the given set of generators, using the given "hasher" function
 * to produce an ID string for each object. This approach is much more efficient than intersecting
 * by comparison (intersectByComparison()), so this should be used instead whenever possible.
 * Efficiency: ?
 * 
 * @param {type} promises
 * @param {type} hasher
 * @returns {undefined}
 */
Generator.intersectByHash = function(generators, hasher) {
	
	return new Generator(function(resolve, reject, emit) {
		var map = {};
		var handlers = [];
		
		for (var i = 0, max = generators.length; i < max; ++i) {
			var generator = generators[i];
			
			var handleEmit = function(item) {
				var id = hasher(item);
				var count = 0;
				if (map[id])
					count = map[id];
				
				count += 1;
				map[id] = count;
				
				if (count == generators.length) {
					emit(item);
				}
			}
			
			if (generator.emit) {
				handlers.push(new Promise(function(resolve, reject) {
					generator.emit(handleEmit).done(function() {
						resolve();
					});
				}));
			} else {
				console.log('WARNING: Passing promises to Generator.intersectByHash() is deprecated. Please wrap it in a Generator first.');
				
				handlers.push(generator.then(function(items) {
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
 * Intersects the given set of generators, using the given "comparator" function
 * to determine if two objects are equal. This form of intersect operation can be much 
 * less efficient than intersection by identity (intersectByIdentity). Efficiency n^2
 * 
 * @param {type} promises
 * @param {type} identify
 * @returns {undefined}
 */
Generator.intersectByComparison = function(generators, comparator) {
	
	return new Generator(function(resolve, reject, emit) {
		var handlers = [];
		var distinctItems = [];
		
		for (var i = 0, max = generators.length; i < max; ++i) {
			var generator = generators[i];
			
			var handleEmit = function(item) {
				var found = false;
				
				for (var j = 0, jMax = distinctItems.length; j < jMax; ++j) {
					var distinctItem = distinctItems[j];
					
					if (comparator(distinctItem.item, item)) {
						distinctItem.count += 1;
						
						if (!distinctItem.emitted && distinctItem.count == generators.length) {
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
				
				if (distinctItem.count == generators.length) {
					emit(distinctItem.item);
					distinctItem.emitted = true;
				}
				
				distinctItems.push(distinctItem);
			}
			
			if (generator.emit) {
				handlers.push(new Promise(function(resolve, reject) {
					generator.emit(handleEmit).then(function() {
						resolve();
					});
				}));
			} else {
				handlers.push(generator.then(function(items) {
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
 * Register a callback for the emit event, when the generator
 * emits an item.
 * 
 * You may also omit the callback and be returned a promise.
 * This promise will resolve when the next item is emitted from the 
 * Generator, but will not be resolved again, because promises only
 * resolve once.
 * 
 * To instead have a recurring handler, you must pass a callback.
 * 
 * @param {type} cb
 * @returns {Generator.prototype}
 */
Generator.prototype.emit = function(cb) {
	if (!cb) {
		var self = this;
		return new Promise(function(resolve, reject) {
			var handler;
			self.emit(handler = function(item) {
				resolve(item);
				
			});
		});
	}
	this._registeredEmits.push(cb);
	return this;
};

Generator.prototype.deregister = function(event, cb) {
	var map = {
		emit: this._registeredEmits,
		catch: this._registeredCatches,
		done: this._registeredDones
	};
	
	if (map[event].indexOf(cb) >= 0)
		map[event].splice(map[event].indexOf(cb), 1);
};

/**
 * Register a callback for the catch event, when the generator encounters
 * an exception or error.
 * 
 * You may also omit the callback and be returned a promise.
 * This promise will either resolve to an error or never resolve.
 * The promise will never reject.
 * 
 * @param {type} cb
 * @returns {Generator.prototype}
 */
Generator.prototype.catch = function(cb) {
	if (!cb) {
		var self = this;
		return new Promise(function(resolve) {
			self.catch(function(err) {
				resolve(err);
			});
		});
	}
	this._registeredCatches.push(cb);
	return this;
};

/**
 * Pass a callback function or pass no arguments to receive
 * a Promise for completion of the generator.
 * 
 * @param {type} cb
 * @returns {Promise|Generator.prototype}
 */
Generator.prototype.done = function(cb) {
	
	if (!cb) {
		var self = this;
		return new Promise(function(resolve, reject) {
			self.done(function() {
				resolve();
			}).catch(function(err) {
				reject(err);
			});
		});
	}
	
	this._registeredDones.push(cb);
	return this;
};

/**
 * To blend nicely with Promises, Generators can start an actual Promise chain.
 * NOTE that this will cause the Generator to store an array of all results emitted 
 * between the registration of this function and when the generator complets (.done()).
 * 
 * This will cause O(N) memory usage instead of O(1), so only use this if you don't 
 * mind storing all generator results into an array (very very bad idea for an 
 * infinite set for example).
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
},{}],3:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  function Foo () {}
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    arr.constructor = Foo
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Foo && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined' && object.buffer instanceof ArrayBuffer) {
    return fromTypedArray(that, object)
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []
  var i = 0

  for (; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (leadSurrogate) {
        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        } else {
          // valid surrogate pair
          codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
          leadSurrogate = null
        }
      } else {
        // no lead yet

        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else {
          // valid lead
          leadSurrogate = codePoint
          continue
        }
      }
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      leadSurrogate = null
    }

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x200000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":4,"ieee754":5,"is-array":6}],4:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],5:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],6:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],7:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],8:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],9:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],10:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":9,"_process":8,"inherits":7}],11:[function(require,module,exports){

function IDBRequestGenerator(request) {
	var cancelled = false;
	return new Generator(function(done, reject, emit) {
		
		request.onsuccess = function(ev) {
			if (!ev.target)
				return;
			
			var cursor = ev.target.result;
			// End the generator if we're done
			if (!cursor) {
				done();
				return;
			}

			if (!cancelled) {
				emit(cursor.value, function() {
					cancelled = true;
				});
			}
			
			// Callback requested us to end early
			
			if (cancelled) {
				done();
				return;
			}
			
			if (!cursor.continue)
				throw "ev is "+ev.target.result;
			cursor.continue();
		};

		request.onerror = function(ev) {
			reject(ev);
		};
	});
}; 

if (typeof window !== 'undefined') {
	window.SkateIDBRequestGenerator = IDBRequestGenerator;
}

module.exports = IDBRequestGenerator;
},{}],12:[function(require,module,exports){
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
		var clone = self.stripCopy(item);
		self.dehydrate(clone);
		self.ready.then(function(db) {
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
	return this.hydrateGenerator(new IDBRequestGenerator(cursor));
};

Repository.prototype.hydrateGenerator = function(generator) {
	var self = this;	
	return new Generator(function(done, reject, emit) {
		generator
			.emit(function(item) {
				self.hydrate(item).then(function(hydratedItem) {
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
									new IDBRequestGenerator(index.openCursor(fieldValue))
										.emit(function(item) {
											items.push(item);
										}).done(function() {
											resolve();
										});
								});


							} else {
								return new Promise(function(resolve, reject) {
									items = [];
									new IDBRequestGenerator(store.openCursor())
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


},{"./IDBRequestGenerator.js":11,"./stripCopy.js":17,"es5-generators":2}],13:[function(require,module,exports){
/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 * SchemaBuilder class
 * 
 */

var transact = require('./transact.js');
var StoreBuilder = require('./StoreBuilder.js');

function SchemaBuilder() {
	this.stores = [];
}; module.exports = SchemaBuilder;

/**
 * Pass in a version change transaction so that we can modify the schema.
 * Without it, no run blocks are run and no changes made to the schema are 
 * applied (they are only modeled for analysis later).
 */
SchemaBuilder.prototype.setDatabase = function(db, transaction) {
	
	this.db = db;
	this.transaction = transaction;
};

SchemaBuilder.prototype.isLive = function() {
	return this.transaction && this.db;
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

},{"./StoreBuilder.js":14,"./transact.js":18}],14:[function(require,module,exports){
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

StoreBuilder.prototype.getField = function(name) {
	if (!this.store.fields[name]) {
		throw {
			error: 'NoSuchField',
			message: 'The field '+name+' does not exist'
		};
	}
	
	return this.store.fields[name];
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

},{}],15:[function(require,module,exports){

// Standardize any prefixed implementations of IndexedDB



if (typeof window !== 'undefined') {
	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
	window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
}
},{}],16:[function(require,module,exports){
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
var transact = require('./transact.js');
var Generator = require('es5-generators');

// API

var skate = {
	version: '0.1',
	
	/**
	 * Exported classes
	 */
	classes: {
		Repository: Repository,
		SchemaBuilder: SchemaBuilder,
		StoreBuilder: StoreBuilder,
		Generator: Generator
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
	 * Start a Skate transaction on the given DB with the given function.
	 * 
	 * A dependency injection process similar to Angular's is done, 
	 * except the injector is capable of providing transaction-related services
	 * instead of user-interface ones.
	 * 
	 * The following services can be injected into the function you pass.
	 * - db           - the current IDBDatabase 
	 * - transaction  - the current IDBTransaction
	 * - transact     - A function bound to the database which allows for starting
	 *                  additional independent transactions
	 * - <name>       - SkateRepository for the given IDB object store, by name
	 * - $<name>      - IDBObjectStore instance for the given store.
	 *                  Note that to do this you must use declarative (array-style)
	 *                  injection.
	 * 
	 * The IDB transaction is created to involve all of the stores you specify within
	 * your injection function. For instance, if you load the 'cars' and 'bikes' 
	 * repositories, as in:
	 *
	 *     skate.transact(db, 'readwrite', function(transaction, cars, bikes) { })
	 * 
	 * Then the transaction passed into the function will be created to allow the cars and bikes
	 * object stores, as if you had done the following stock IndexedDB call:
	 * 
	 *     var tx = db.transaction(['cars', 'bikes'], 'readwrite');
	 *     var cars = tx.objectStore('cars');
	 *     var bikes = tx.objectStore('bikes');
	 * 
	 * @param {type} db
	 * @param {type} fn
	 * @returns {undefined}
	 */
	transact: function(db, mode, fn) {
		return transact(db, null, fn, mode);
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
	 *		skate.transact(db, function(apples) {
	 *			apples.find({
	 *				size: 'large'
	 *			}).emit(function(apple) {
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
			
			//console.log('[skate] Schema update required from '+oldVersion+' to '+newVersion);
			//console.log('[skate] Loading schema history...');
			
			for (var version = 1; version <= oldVersion; ++version) {
				//console.log(' - Loading schema version #'+version+' (model-only)');
				options.migrations[version](schema);
			}
			
			schema.setDatabase(db, event.currentTarget.transaction);
			db.onerror = function (event) {
				console.error('[skate] Error while building database schema');
				console.log(event);
			};

			//console.log('[skate] Applying migrations...');
			for (var version = oldVersion+1; version <= newVersion; ++version) {
				//console.log('[skate] - Applying schema version #'+version+' (live)');
				options.migrations[version](schema);
			}
			
			schema.disconnectDatabase();
			//console.log('Schema updated successfully.');

			db.onerror = null;
		};
		
		return ready;
	}
}; module.exports = skate;

},{"./Repository.js":12,"./SchemaBuilder.js":13,"./StoreBuilder.js":14,"./idbStandardize.js":15,"./transact.js":18,"es5-generators":2}],17:[function(require,module,exports){
var deepcopy = require('deepcopy');

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
	var copy;
			
	//copy = angular.copy(obj);
	copy = deepcopy(obj);
	strip(obj);
	return obj;
};

module.exports = stripCopy;
},{"deepcopy":1}],18:[function(require,module,exports){
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
				var storeName = param;
				
				if (storeName.indexOf('store:') == 0) {
					storeOnly = true;
					storeName = storeName.replace(/^store:/, '');
				}
				
				var store;
				try {
					store = this.transaction.objectStore(storeName);
				} catch (e) {
					throw new SkateUnknownStoreException('No such object store '+param);
				}
				
				if (storeOnly) {
					this[param] = store;
				} else {
					this[param] = new Repository(db, param, this.transaction);
				}
			}
		}
	}, null, fn);
};

module.exports = transact;
},{"./Repository.js":12,"./utils/annotateFn.js":19,"./utils/lightinjector.js":20}],19:[function(require,module,exports){
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
},{}],20:[function(require,module,exports){
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
		
		if (typeof factory === 'function') {
			args.push(factory(inject));
		} else {
			args.push(factory);
		}
		
	}
	
	return fn.apply(self, args);
}

inject.InjectionException = InjectionException;
module.exports = inject;
},{"./annotateFn.js":19}]},{},[16]);
