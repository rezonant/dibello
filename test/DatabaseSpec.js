var Database = require('../src/Database.js');
var SchemaBuilder = require('../src/SchemaBuilder.js');
var idbMock = require('indexeddb-mock');

describe('Database.transact', function() {
	it('should work with an injection function requiring no dependencies', function(done) {
		idbMock.reset();		
		idbMock.mock.open('dbname', 1).onsuccess = function(ev) {
			var idb = ev.target.result;
			
			var schema = new SchemaBuilder(); 
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
			
			var schema = new SchemaBuilder(); 
			var db = new Database(schema, idb);
			
			db.transact('readonly', function($$db) {
				expect($$db).toBe(idb);
				done();
			});
		};
	});
	it('should expose the SchemaBuilder as $schema', function(done) {
		idbMock.reset();
		
		idbMock.mock.open('dbname', 1).onsuccess = function(ev) {
			var idb = ev.target.result;
			
			var schema = new SchemaBuilder(); 
			var db = new Database(schema, idb);
			
			db.transact('readonly', function($schema) {
				expect($schema).toBe(schema);
				done();
			});
		};
	});
	it('should expose the Database as $db', function(done) {
		idbMock.reset();
		
		idbMock.mock.open('dbname', 1).onsuccess = function(ev) {
			var idb = ev.target.result;
			
			var schema = new SchemaBuilder(); 
			var db = new Database(schema, idb);
			
			db.transact('readonly', function($db) {
				expect($db).toBe(db);
				done();
			});
		};
	});
});