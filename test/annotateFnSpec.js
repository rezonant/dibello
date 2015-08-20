
var annotateFn = require('../src/utils/annotateFn.js');

describe('annotateFn', function() {
	it('should work with a parameterless function', function() {
		var metadata = annotateFn(function() { });
		expect(typeof metadata.fn).toBe('function');
	});
	it('should work with a 1-parameter function', function() {
		var metadata = annotateFn(function(x) { });
		expect(typeof metadata.fn).toBe('function');
		expect(metadata.params.length).toBe(1);
		expect(metadata.params[0]).toBe('x');
	});
	it('should work with a 2-parameter function', function() {
		var metadata = annotateFn(function(a,b) { });
		expect(typeof metadata.fn).toBe('function');
		expect(metadata.params.length).toBe(2);
		expect(metadata.params[0]).toBe('a');
		expect(metadata.params[1]).toBe('b');
	});
	it('should work with a declarative injection function', function() {
		var metadata = annotateFn(['a', 'b', 'c', function() { }]);
		expect(typeof metadata.fn).toBe('function');
		expect(metadata.params.length).toBe(3);
		expect(metadata.params[0]).toBe('a');
		expect(metadata.params[1]).toBe('b');
		expect(metadata.params[2]).toBe('c');
	});
});

