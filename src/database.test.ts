import { Database } from './database';
import { SchemaBuilder } from './schema-builder';
import { suite } from 'razmin';
import { expect } from 'chai';

import * as idbMock from 'indexeddb-mock';

suite(describe => {
	describe("Database.open()", it => {
		it("returns a promise to provide a dibello.Database containing an IDB database", function(done) {
			var promise = Database.open('test123', {version: 3}, idbMock.mock);

			promise.then(function(db) {
				expect(db.idb().name).to.equal('test123');
				expect(db.idb().version).to.equal(3);
				done(); 
			});
		});
		
		it("calls migrations in order before resolving", function(done) {
			
			idbMock.reset();
			idbMock.flags.upgradeNeeded = true;
			
			var testKey = '';
			var promise = Database.open('test123', {
				version: 4,
				migrations: {
					"1": function() { testKey += '1'; },
					"2": function() { testKey += '2'; },
					"3": function() { testKey += '3'; },
					"4": function() { testKey += '4'; }
				}
			}, idbMock.mock);
			
			promise.then(function(db) {
				
				expect(testKey).to.equal('1234');
				done();
			});
		});
		
		it("provides a SchemaBuilder to each migration", function(done) {
			
			idbMock.reset();
			idbMock.flags.upgradeNeeded = true;
			
			var testKey = '';
			var promise = Database.open('test123', {
				version: 2,
				migrations: {
					"1": function(schema) { 
						testKey += 1;
						expect(schema).not.to.be.null;
						expect(typeof schema.createStore).to.equal('function');
						expect(typeof schema.getStore).to.equal('function');
					},
					"2": function(schema) { 
						testKey += 2;
						expect(schema).not.to.be.null;
						expect(typeof schema.createStore).to.equal('function');
						expect(typeof schema.getStore).to.equal('function');
					},
				}
			}, idbMock.mock);
			
			promise.then(function(db) {
				expect(testKey).to.equal('12');
				done();
			});
		});
		
		it("calls only migrations up to the version of the schema", function(done) {
			
			idbMock.reset();
			idbMock.flags.upgradeNeeded = true;
			
			var testKey = '';
			var promise = Database.open('test123', {
				version: 4,
				migrations: {
					"1": function() { testKey += '1'; },
					"2": function() { testKey += '2'; },
					"3": function() { testKey += '3'; },
					"4": function() { testKey += '4'; },
					"5": function() { testKey += '5'; }
				}
			}, idbMock.mock);
			
			promise.then(function(db) {
				
				expect(testKey).to.equal('1234');
				done();
			});
		});
		
		it("calls migrations with the correct builder modes", function(done) {
			
			idbMock.reset();
			idbMock.flags.upgradeNeeded = true;
			idbMock.flags.initialVersion = 3;
			
			var testKey = '';
			var promise = Database.open('test123', {
				version: 5,
				migrations: {
					"1": function(schema) { 
						testKey += 1 + (schema.isLive() ? '!' : '.');
					},
					"2": function(schema) { 
						testKey += 2 + (schema.isLive() ? '!' : '.');
					},
					"3": function(schema) { 
						testKey += 3 + (schema.isLive() ? '!' : '.');
					},
					"4": function(schema) { 
						testKey += 4 + (schema.isLive() ? '!' : '.');
					},
					"5": function(schema) { 
						testKey += 5 + (schema.isLive() ? '!' : '.');
					},
				}
			}, idbMock.mock);
			
			promise.then(function(db) {
				expect(testKey).to.equal('1.2.3.4!5!');
				done();
			});
		});
		
		it("calls migrations with the correct builder modes", function(done) {
			
			idbMock.reset();
			idbMock.flags.upgradeNeeded = true;
			idbMock.flags.initialVersion = 3;
			
			var testKey = '';
			var promise = Database.open('test123', {
				version: 5,
				migrations: {
					"1": function(schema) { 
						testKey += 1 + (schema.isLive() ? '!' : '.');
					},
					"2": function(schema) { 
						testKey += 2 + (schema.isLive() ? '!' : '.');
					},
					"3": function(schema) { 
						testKey += 3 + (schema.isLive() ? '!' : '.');
					},
					"4": function(schema) { 
						testKey += 4 + (schema.isLive() ? '!' : '.');
					},
					"5": function(schema) { 
						testKey += 5 + (schema.isLive() ? '!' : '.');
					},
				}
			}, idbMock.mock);
			
			promise.then(function(db) {
				expect(testKey).to.equal('1.2.3.4!5!');
				done();
			});
		});	
	});

	describe('Database.repository', it => {
		it('should work', function(done) {
			idbMock.reset();
			idbMock.mock.open('dbname', 1).onsuccess = function(ev) {
				var idb = ev.target.result;
				
				var schema = new SchemaBuilder('test'); 
				var db = new Database(schema, idb);
				
				var repo = db.repository('foo');
				
				expect(repo).not.to.be.null;
				expect(typeof repo.find).to.equal('function');
				done();
			};
		});
		
	});

	describe('Database.configRepository', it => {
		it('should work', function(done) {
			idbMock.reset();
			idbMock.mock.open('dbname', 1).onsuccess = function(ev) {
				var idb = ev.target.result;
				
				var schema = new SchemaBuilder('test'); 
				var db = new Database(schema, idb);
				var good1 = false, good2 = false;
				
				db.configRepository('foo', function() {
					good1 = true;
				});
				db.configRepository('foo', function() {
					good2 = true;
				});
				
				var repo = db.repository('foo');
				
				expect(repo).not.to.be.null;
				expect(good1).to.equal(true);
				expect(good2).to.equal(true);
				done();
			};
		});
		
	});

	describe('Database.transact', it => {
		it('should work with an injection function requiring no dependencies', function(done) {
			idbMock.reset();
			idbMock.mock.open('dbname', 1).onsuccess = function(ev) {
				var idb = ev.target.result;
				
				var schema = new SchemaBuilder('test'); 
				var db = new Database(schema, idb);
				
				db.transact('readonly', function() {
					done();
				});
			};
		});
		it('should expose the IDBDatabase as $$db', function(done) {
			idbMock.reset();
			
			idbMock.mock.open('dbname', 1).onsuccess = function(ev) {
				var idb = ev.target.result;
				
				var schema = new SchemaBuilder('test'); 
				var db = new Database(schema, idb);
				
				db.transact('readonly', function($$db) {
					expect($$db).to.equal(idb);
					done();
				});
			};
		});
		it('should expose the SchemaBuilder as $schema', function(done) {
			idbMock.reset();
			
			idbMock.mock.open('dbname', 1).onsuccess = function(ev) {
				var idb = ev.target.result;
				
				var schema = new SchemaBuilder('test');
				var db = new Database(schema, idb);
				
				db.transact('readonly', function($schema) {
					expect($schema).to.equal(schema);
					done();
				});
			};
		});
		it('should expose the Database as $db', function(done) {
			idbMock.reset();
			
			idbMock.mock.open('dbname', 1).onsuccess = function(ev) {
				var idb = ev.target.result;
				
				var schema = new SchemaBuilder('test');
				var db = new Database(schema, idb);
				
				db.transact('readonly', function($db) {
					expect($db).to.equal(db);
					done();
				});
			};
		});
	});
});