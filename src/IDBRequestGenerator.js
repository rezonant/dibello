/**
 * Module providing a class that converts an IDBRequest into a
 * Generator.
 *
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti  
 */

/**
 * Converts an IDBRequest into a Generator
 * @class
 * @alias module:skate.IDBRequestGenerator
 * @param {IDBRequest} request
 * @returns {Generator}
 */
function IDBRequestGenerator(request) {
	var cancelled = false;
	return new Generator(function(done, reject, emit) {
		
		request.onsuccess = function(ev) {
			if (!ev.target)
				return;
			
			var result = ev.target.result;
			emit(result);
			done();
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