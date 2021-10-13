import idbMock from 'indexeddb-mock';
import { SchemaBuilder } from './schema-builder';
import { Database } from './database';
import { suite } from 'razmin';
import { expect } from 'chai';

suite(describe => {
	describe("SchemaBuilder", it => {
		it("should throw when requesting a store that doesn't exist", function(done) {
			var builder = new SchemaBuilder('test');
			var exception = null;
			
			try {
				builder.getStore('foo');
			} catch(e) {
				exception = e;
			}
			
			expect(exception).to.exist;
			done();
		});
		
		it("should only execute .run() blocks in live DB mode", function(done) {
			var builder = new SchemaBuilder('test');
			var good = false;
			
			builder.run(function() {
				expect(true).to.equal(false);
			});
			
			builder.setDatabase({idb: function() { }, getSchema: function() { return {} } }, {});
			builder.run(function() {
				good = true;
			});
			
			builder.disconnectDatabase();
			
			builder.run(function() {
				expect(true).to.equal(false);
			});
			
			expect(good).to.equal(true);
			done();
		});
		
		it("should inject repos in .run() blocks", function(done) {
			var builder = new SchemaBuilder('test');
			var good = false;
			idbMock.reset();
			idbMock.mock.open('dbname', 1).onsuccess = function(ev) {
				var idb = ev.target.result;
				var db = new Database(builder, idb);
				
				builder.setDatabase(db, idb.transaction(['foo'], 'readonly'));

				builder.run(function(foo) {
					good = true;
					expect(typeof foo).to.equal('object');
				});

				expect(good).to.equal(true);
				done();
			};
		});
		
		it("should create a store builder and allow to request it", function(done) {
			var builder = new SchemaBuilder('test');
			var exception = null;
			
			var storeBuilder = builder.createStore('foo');
			
			try {
				var builder2 = builder.getStore('foo');
				expect(storeBuilder).to.equal(builder2);
				
			} catch(e) {
				exception = e;
			}
			
			expect(exception).to.be.null;
			done();
		});
		
		it("should track fields which are built", function(done) {
			var builder = new SchemaBuilder('test');
			var exception = null;
			
			var store = builder.createStore('foo');
			
			store.field('abc');
			expect(store.store.fields.abc).to.exist;
			
			store.field('def');
			expect(store.store.fields.def).to.exist;
			
			// Read it back
			
			expect(store.getField('def').name).to.equal('def');
			expect(store.getField('def').index).to.equal('def');
			expect(store.getField('def').unique).to.equal(false);
			expect(store.getField('abc').name).to.equal('abc');
			expect(store.getField('abc').index).to.equal('abc');
			expect(store.getField('abc').unique).to.equal(false);
			
			done();
		});
	});
});