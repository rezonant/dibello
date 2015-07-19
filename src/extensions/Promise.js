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


