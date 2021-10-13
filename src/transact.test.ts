
import { Database } from './database';
import { transact } from './transact';
import { SchemaBuilder } from './schema-builder';
import { suite } from 'razmin';
import { expect } from 'chai';

function mockedDB() {
	return {
		iamadb: true
	};
}

suite(describe => {
	describe('transact()', it => {
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
				expect($transaction._mode).to.equal('readwrite');
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
				expect($transaction._mode).to.equal('readwrite');
				expect($transaction._stores).to.contain('foo');
				expect(foo.get).to.exist;
				
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
				expect($transaction._mode).to.equal('readwrite');
				expect($transaction._stores).to.contain('foo');
				expect($transaction._stores).to.contain('bar');
				expect($transaction._stores).to.contain('baz');
				expect(foo.storeName).to.equal('foo');
				expect(bar.storeName).to.equal('bar');
				expect(baz.storeName).to.equal('baz');
				
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
				expect($$db.iamadb).to.equal(true);
				
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
				expect(typeof $db.transact).to.equal('function');
				
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
				expect(item).to.be.undefined;
				expect(item2).to.equal(false);
				
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
				expect($$foo._name).to.equal('foo');
				expect(typeof $$foo.get).to.equal('function');
			}, 'readwrite');
		});
	});
});