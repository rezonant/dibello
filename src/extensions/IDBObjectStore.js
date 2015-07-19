
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
