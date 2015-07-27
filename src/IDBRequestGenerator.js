
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