/**
 * Module providing a class that converts an IDBCursor into a
 * Generator.
 *
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti  
 */

/**
 * Converts an IndexedDB IDBCursor into an ES5 Generator
 * (see es5-generators).
 * 
 * Using the resulting generator, you can attach .emit()
 * and .done() events to the generator to be notified when
 * a new item is received from IndexedDB and when the request
 * has fully completed, respectively. Use .then() to get an
 * array of all items which are emitted after registering,
 * but this requires O(N) memory instead of O(1).
 * 
 * @class
 * @alias module:dibello.IDBCursorGenerator
 * @param {IDBCursor} cursor The cursor to generate items with.
 */
function IDBCursorGenerator(cursor) {
	var request = cursor;
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
	window.SkateIDBCursorGenerator = IDBCursorGenerator;
}

module.exports = IDBCursorGenerator;