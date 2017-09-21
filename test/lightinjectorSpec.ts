import { inject } from '../src/utils/light-injector';

describe('lightinjector', function() {
	it('injects no parameters for a parameterless function', function(done) {
		inject({
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
		
		inject(map, this, function(a, b) { 
			expect(a).toBe(123);
			expect(b).toBe(321);
		});
		 
		inject(map, this, function(b, a) {
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
		
		inject(map, this, function() { 
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
		
		inject(map, this, function(a, b123) { 
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
		
		inject(map, this, function(a, b123) { 
			expect(a).toBe(123);
			expect(typeof b123).toBe('function');
			
			done();
		});
	});
});
