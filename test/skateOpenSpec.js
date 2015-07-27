
var skate = require('../src/skate.js');

describe("skate.open()", function() {
	function simpleMockedDB() {
		return {
			open: function(name, version) {
				var request = {
					name: name,
					version: version
				};

				setTimeout(function() {
					if (request.onsuccess) {
						request.ready = true;
						request.result = request;
						request.onsuccess({target:request, currentTarget:request});
					}
				}, 1);

				return request;
			}
		};
	}
	
	function migratedMockedDB(initialVersion) {
		if (!initialVersion)
			initialVersion = 1;
		
		return {
			open: function(name, version) {
				var request = {
					name: name,
					version: initialVersion
				};

				setTimeout(function() {
					if (request.onsuccess) {

						request.ready = true;
						request.result = {
							name: request.name,
							version: request.version,
							transaction: function(deps, mode) {
								return {
									_dependencies: deps,
									_mode: mode,

									objectStore: function(name) {
										var tx = this;
										return {
											_name: name,
											_tx: tx
										};
									}
								};
							}
						};

						if (request.version < version) {
							request.transaction = {
								name: 'version-change-transaction-fool'
							};
							request.onupgradeneeded({
								oldVersion: request.version,
								newVersion: version,
								target: request,
								currentTarget: request
							});
						}

						request.onsuccess({
							target: request, currentTarget: request
						});
					}
				}, 1);

				return request;
			}
		};
	}
	
	it("returns a promise to provide an IDB database by name", function(done) {
		
		var promise = skate.open(simpleMockedDB(), 'test123', {version: 3});
		
		promise.then(function(db) {			
			expect(db.idb().name).toBe('test123');
			expect(db.idb().version).toBe(3);
			expect(db.idb().ready).toBe(true);
			done(); 
		});
	});
	
	it("calls migrations in order before resolving", function(done) {
		
		var testKey = '';
		var promise = skate.open(migratedMockedDB(), 'test123', {
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
		
		var testKey = '';
		var promise = skate.open(migratedMockedDB(), 'test123', {
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
		
		var testKey = '';
		var promise = skate.open(migratedMockedDB(), 'test123', {
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
		
		var testKey = '';
		var promise = skate.open(migratedMockedDB(3), 'test123', {
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
		
		var testKey = '';
		var promise = skate.open(migratedMockedDB(3), 'test123', {
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