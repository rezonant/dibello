
function IDBCursorGenerator(request) {
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