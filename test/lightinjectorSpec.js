
var lightinjector = require('../src/utils/lightinjector.js');

describe('lightinjector', function() {
	it('injects no parameters for a parameterless function', function(done) {
		lightinjector({
			a: 123,
			b: 321
		}, null, function() { 
			expect(arguments.length).toBe(0);
			done();
		});
	});
	it('provides parameters in any order', function(done) {
		var map = {
			a: 123,
			b: 321
		};
		
		lightinjector(map, this, function(a, b) { 
			expect(a).toBe(123);
			expect(b).toBe(321);
		});
		 
		lightinjector(map, this, function(b, a) {
			expect(a).toBe(123);
			expect(b).toBe(321);
			done();
		});
	});
	
	it('calls $populate$ before injection', function(done) {
		var injectionReady = false;
		var map = {
			$populate$: function() {
				injectionReady = true;
			}
		};
		
		lightinjector(map, this, function() { 
			if (!injectionReady)
				expect(true).toBe(false);
			
			done();
		});
	});
	
	it('calls $any$ when no service is available', function(done) {
		var map = {
			a: 123,
			$any$: function(name) {
				return name;
			}
		};
		
		lightinjector(map, this, function(a, b123) { 
			expect(a).toBe(123);
			expect(b123).toBe('b123');
			
			done();
		});
	});
	
	it('provides the inject function to $any$', function(done) {
		var map = {
			a: 123,
			$any$: function(name, inject) {
				return inject;
			}
		};
		
		lightinjector(map, this, function(a, b123) { 
			expect(a).toBe(123);
			expect(typeof b123).toBe('function');
			
			done();
		});
	});
});
