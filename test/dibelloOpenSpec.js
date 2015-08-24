
var dibello = require('../src/dibello.js');
var idbMock = require('indexeddb-mock');

describe("dibello.open()", function() {
	it("returns a promise to provide a dibello.Database containing an IDB database", function(done) {
		var promise = dibello.open(idbMock.mock, 'test123', {version: 3});

		promise.then(function(db) {
			expect(db.idb().name).toBe('test123');
			expect(db.idb().version).toBe(3);
			done(); 
		});
	});
	
	it("calls migrations in order before resolving", function(done) {
		
		idbMock.reset();
		idbMock.flags.upgradeNeeded = true;
		
		var testKey = '';
		var promise = dibello.open(idbMock.mock, 'test123', {
			version: 4,
			migrations: {
				"1": function() { testKey += '1'; },
				"2": function() { testKey += '2'; },
				"3": function() { testKey += '3'; },
				"4": function() { testKey += '4'; }
			}
		});
		
		promise.then(function(db) {
			
			expect(testKey).toBe('1234');
			done();
		});
	});
	
	it("provides a SchemaBuilder to each migration", function(done) {
		
		idbMock.reset();
		idbMock.flags.upgradeNeeded = true;
		
		var testKey = '';
		var promise = dibello.open(idbMock.mock, 'test123', {
			version: 2,
			migrations: {
				"1": function(schema) { 
					testKey += 1;
					expect(schema).not.toBeNull();
					expect(typeof schema.createStore).toBe('function');
					expect(typeof schema.getStore).toBe('function');
				},
				"2": function(schema) { 
					testKey += 2;
					expect(schema).not.toBeNull();
					expect(typeof schema.createStore).toBe('function');
					expect(typeof schema.getStore).toBe('function');
				},
			}
		});
		
		promise.then(function(db) {
			expect(testKey).toBe('12');
			done();
		});
	});
	
	it("calls only migrations up to the version of the schema", function(done) {
		
		idbMock.reset();
		idbMock.flags.upgradeNeeded = true;
		
		var testKey = '';
		var promise = dibello.open(idbMock.mock, 'test123', {
			version: 4,
			migrations: {
				"1": function() { testKey += '1'; },
				"2": function() { testKey += '2'; },
				"3": function() { testKey += '3'; },
				"4": function() { testKey += '4'; },
				"5": function() { testKey += '5'; }
			}
		});
		
		promise.then(function(db) {
			
			expect(testKey).toBe('1234');
			done();
		});
	});
	
	it("calls migrations with the correct builder modes", function(done) {
		
		idbMock.reset();
		idbMock.flags.upgradeNeeded = true;
		idbMock.flags.initialVersion = 3;
		
		var testKey = '';
		var promise = dibello.open(idbMock.mock, 'test123', {
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
		});
		
		promise.then(function(db) {
			expect(testKey).toBe('1.2.3.4!5!');
			done();
		});
	});
	
	it("calls migrations with the correct builder modes", function(done) {
		
		idbMock.reset();
		idbMock.flags.upgradeNeeded = true;
		idbMock.flags.initialVersion = 3;
		
		var testKey = '';
		var promise = dibello.open(idbMock.mock, 'test123', {
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
		});
		
		promise.then(function(db) {
			expect(testKey).toBe('1.2.3.4!5!');
			done();
		});
	});
	
});