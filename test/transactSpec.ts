
import { Database } from '../src/database';
import { transact } from '../src/transact';
import { SchemaBuilder } from '../src/schema-builder';

function mockedDB() {
	return {
		iamadb: true
	};
}

describe('transact()', function() {
	it('should inject the transaction', function() {
		transact(new Database(new SchemaBuilder('foo', {}), mockedDB()), function(stores, mode) {
			return {
				_stores: stores,
				_mode: mode,
				
				objectStore: function(name) {
					return {
						
					};
				}
			};
		}, null, function($transaction) {
			expect($transaction._mode).toBe('readwrite');
		}, 'readwrite');
	});
	
	it('should inject a valid object store', function() {
		transact(new Database(new SchemaBuilder('foo', {}), mockedDB()), function(stores, mode) {
			return {
				_stores: stores,
				_mode: mode,
				
				objectStore: function(name) {
					return {
						get: function() {}
					};
				}
			};
		}, null, function($transaction, foo) {
			expect($transaction._mode).toBe('readwrite');
			expect($transaction._stores).toContain('foo');
			expect(foo.get).toBeTruthy();
			
		}, 'readwrite');
	});
	
	it('should request all needed stores', function() {
		transact(new Database(new SchemaBuilder('foo', {}), mockedDB()), function(stores, mode) {
			return {
				_stores: stores,
				_mode: mode,
				
				objectStore: function(name) {
					return {
						_name: name,
						get: function() {}
					};
				}
			};
		}, null, function($transaction, foo, bar, baz) {
			expect($transaction._mode).toBe('readwrite');
			expect($transaction._stores).toContain('foo');
			expect($transaction._stores).toContain('bar');
			expect($transaction._stores).toContain('baz');
			expect(foo.storeName).toBe('foo');
			expect(bar.storeName).toBe('bar');
			expect(baz.storeName).toBe('baz');
			
		}, 'readwrite');
	});
	
	it('should inject the idb', function() {
		transact(new Database(new SchemaBuilder('foo', {}), mockedDB()), function(stores, mode) {
			return {
				_stores: stores,
				_mode: mode,
				
				objectStore: function(name) {
					return {
						_name: name,
						get: function() {}
					};
				}
			};
		}, null, function($$db) {
			expect($$db.iamadb).toBe(true);
			
		}, 'readwrite');
	});
	
	it('should inject the db', function() {
		transact(new Database(new SchemaBuilder('foo', {}), mockedDB()), function(stores, mode) {
			return {
				_stores: stores,
				_mode: mode,
				
				objectStore: function(name) {
					return {
						_name: name,
						get: function() {}
					};
				}
			};
		}, null, function($db) {
			expect(typeof $db.transact).toBe('function');
			
		}, 'readwrite');
	});
	
	it('should be able to inject falsey injectables', function() {
		transact(new Database(new SchemaBuilder('foo', {}), mockedDB()), function(stores, mode) {
			return {
				_stores: stores,
				_mode: mode,
				
				objectStore: function(name) {
					return {
						_name: name,
						get: function() {}
					};
				}
			};
		}, null, function(item, item2) {
			expect(item).toBeUndefined();
			expect(item2).toBe(false);
			
		}, 'readwrite', { item: undefined, item2: false });
	});
	
	it('should inject only the stores with $$ prefix', function() {
		transact(new Database(new SchemaBuilder('foo', {}), mockedDB()), function(stores, mode) {
			return {
				_stores: stores,
				_mode: mode,
				
				objectStore: function(name) {
					return {
						_name: name,
						get: function() {}
					};
				}
			};
		}, null, function($$foo) {
			expect($$foo._name).toBe('foo');
			expect(typeof $$foo.get).toBe('function');
		}, 'readwrite');
	});
});