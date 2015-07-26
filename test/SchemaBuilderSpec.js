
var SchemaBuilder = require('../src/SchemaBuilder.js');

describe("SchemaBuilder", function() {
	it("should throw when requesting a store that doesn't exist", function(done) {
		var builder = new SchemaBuilder();
		var exception = null;
		
		try {
			builder.getStore('foo');
		} catch(e) {
			exception = e;
		}
		
		expect(exception).toBeTruthy();
		done();
	});
	
	it("should create a store builder and allow to request it", function(done) {
		var builder = new SchemaBuilder();
		var exception = null;
		
		var builder = builder.createStore('foo');
		
		try {
			var builder2 = builder.getStore('foo');
			expect(builder).toBe(builder2);
			
		} catch(e) {
			exception = e;
		}
		
		expect(exception).toBeNull();
		done();
	});
	
	it("should track fields which are built", function(done) {
		var builder = new SchemaBuilder();
		var exception = null;
		
		var store = builder.createStore('foo');
		
		store.field('abc');
		expect(store.store.fields.abc).toBeTruthy();
		
		store.field('def');
		expect(store.store.fields.def).toBeTruthy();
		
		// Read it back
		
		expect(store.getField('def').name).toBe('def');
		expect(store.getField('def').index).toBe('def');
		expect(store.getField('def').unique).toBe(false);
		expect(store.getField('abc').name).toBe('abc');
		expect(store.getField('abc').index).toBe('abc');
		expect(store.getField('abc').unique).toBe(false);
		
		done();
	});
});
