
function IDBCursorGenerator(request) {
	return new Generator(function(done, reject, emit) {
		request.onsuccess = function(ev) {
			var cursor = ev.target.result;
			
			// End the generator if we're done
			if (!cursor) {
				done();
				return;
			}

			var ret = cb(cursor.value);
			if (typeof ret === 'undefined')
				ret = true;

			// Callback requested us to end early
			
			if (!ret) {
				done();
				return;
			}
			
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