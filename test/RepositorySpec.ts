
import { Repository } from '@dibello/repository';
import { Database } from '@dibello/database';
import { SchemaBuilder } from '@dibello/schema-builder';

// import { Generator } from 'es5-generators';
import * as idbMock from 'indexeddb-mock';

describe('Repository.getStoreTransaction()', function() { 
	it('should return a new transaction', function(done) {
		
		idbMock.reset();
		var dbRequest = idbMock.mock.open('somedb', 1);
		dbRequest.onsuccess = function(ev) {
			var idb = ev.target.result;
			var db = new Database(new SchemaBuilder('foo'), idb);
			var repo = new Repository(db, 'foo');
			var tx : any = repo.getStoreTransaction(db, 'readwrite');

			expect(tx._stores.length).toBe(1);
			expect(tx._stores).toContain('foo'); 
			expect(tx._mode).toBe('readwrite'); 
			done();
		};
	});
});

describe('Repository.generateGuid()', function() {
	it('should generate a decently long string', function() {
		var guid = Repository.generateGuid();
		expect (guid.length > 10).toBe(true);
	});
});

describe('Repository.index()', function() {
	it('should work', function(done) {
		
		idbMock.reset();
		var dbRequest = idbMock.mock.open('somedb', 1);
		dbRequest.onsuccess = function(ev) {
			var idb = ev.target.result;
			var db = new Database(new SchemaBuilder('foo'), idb);
			var repo = new Repository(db, 'foo');
			var index = repo.index('foo'); 
			
			expect(typeof index).toBe('object');
			done();
		};
	});
});

describe('Repository.setTransaction()', function() {
	
	it('should set the active transaction on the repository', function(done) {
		idbMock.reset();
		var dbRequest = idbMock.mock.open('somedb', 1);
		dbRequest.onsuccess = function(ev) {
			var db = ev.target.result;
			var repo : any = new Repository(new Database(new SchemaBuilder('foo'), db), 'foo');
			var tx = { _stores: [] };

			repo.setTransaction(tx);
			expect(repo._transaction).toBe(tx);
			done();
		};
	});
	it('should cause getStoreTransaction() to return the set transaction', function(done) {
		idbMock.reset();
		var dbRequest = idbMock.mock.open('somedb', 1);
		dbRequest.onsuccess = function(ev) {
			var idb = ev.target.result;
			var db = new Database(new SchemaBuilder('foo'), db);
			var repo : any = new Repository(db, 'foo');
			var tx = {_stores: []};

			repo.setTransaction(tx);
			expect(repo.getStoreTransaction(db)).toBe(tx);
			done();
		};
	});
});
describe('Repository.persist()', function() {
	it('should call the underlying store.put() method', function(done) {
		idbMock.reset();
		var dbRequest = idbMock.mock.open('somedb', 1);
		dbRequest.onsuccess = function(ev) {
			var idb = ev.target.result;
			var db = new Database(new SchemaBuilder('foo'), idb);
			var repo = new Repository(db, 'foo');
			var tx = repo.getStoreTransaction(db);

			repo.setTransaction(tx);	 

			repo.persist({ id: '123', foo: 'bar' }).then(function() {
				var store : any = tx.objectStore('foo');
				expect(store._itemsPut.length).toBe(1);
				expect(store._itemsPut[0].key).toBe('123');
				expect(store._itemsPut[0].item.foo).toBe('bar');
				done();
			});
		};
		
	});
});

describe('Repository.get()', function() {	  
	it('should call the underlying store.get() method', function(done) {
		idbMock.reset();
		var dbRequest = idbMock.mock.open('somedb', 1);
		dbRequest.onsuccess = function(ev) {
			var idb = ev.target.result;
			var schema = new SchemaBuilder('foo');
			schema.createStore('foo');
			var db = new Database(schema, idb);
			var repo = new Repository(db, 'foo');
			var tx = repo.getStoreTransaction(db);
			var getCalled = false;

			tx.objectStore('foo').get = function(key) {
				getCalled = true;
				expect(key).toBe('123');

				return idbMock.request.success(
					{ id: '123' }, true);
			};

			repo.setTransaction(tx);	 
			repo.get('123').then(function(item) {
				expect(item.id).toBe('123');
				expect(getCalled).toBe(true);
				done();
			});
		};
		
	});
});

describe('Repository.index()', function() {
	  
	it('should call the underlying store.index() method', function(done) {
		
		if (true == true) { done(); return }; // TODO
		
		idbMock.reset();
		var dbRequest = idbMock.mock.open('somedb', 1);
		dbRequest.onsuccess = function(ev) {
			var idb = ev.target.result;
			var schema = new SchemaBuilder('foo');
			schema.createStore('foo');
			var db = new Database(schema, idb);
			var repo = new Repository(db, 'foo');
			var tx = repo.getStoreTransaction(db);
			var getCalled = false;

			tx.objectStore('foo').index = function(key) {
				getCalled = true;
				expect(key).toBe('123');

				return idbMock.request.success([
					{ id: '123' }
				], true);
			};

			repo.setTransaction(tx);	 
			repo.get('123').then(function(item) {
				expect(item.id).toBe('123');
				expect(getCalled).toBe(true);
				done();
			});
		};
		
	});
});

describe('Repository.all()', function() {
	
	it('should call the underlying store.openCursor() method', function(done) {
		
		idbMock.reset();
		var dbRequest = idbMock.mock.open('somedb', 1);
		dbRequest.onsuccess = async function(ev) {
			var idb = ev.target.result;
			var schema = new SchemaBuilder('foo');
			schema.createStore('foo');
			var db = new Database(schema, idb);
			var repo = new Repository(db, 'foo');
			var tx = repo.getStoreTransaction(db);
			var store = tx.objectStore('foo');
			var getCalled = false;

			repo.setTransaction(tx);

			store.openCursor = function() {
				var itemAccept;
				var itemAccepted = new Promise((rs, rj) => {
					itemAccept = rs;
				})

				var request : any = {
					onsuccess: function() { console.log('BUG: DEFAULT YIELD CALLED'); },
					_finishes: async function() { 
						await itemAccepted;
						var target = {
							result: null
						};  
						this.onsuccess({target: target, currentTarget: target});
					},
				};

				setTimeout(function() {
					var target = {
						result: {
							value: {
								id: '123'
							},
							"continue": function() { itemAccept(); }
						}
					};
					request.onsuccess({
						target: target,
						currentTarget: target
					});
					request._finishes();
				}, 1);

				return request;
			};

			let count = 0;

			for await (let item of repo.all()) {
				expect((<any>item).id).toBe('123');
				++count;
			}

			expect(count).toBe(1);
			done();
		};
		
	});
});

describe('Repository.getMany()', function() {
	
	it('should call the underlying store.get() method', function(done) {
		
		idbMock.reset();
		var dbRequest = idbMock.mock.open('somedb', 1);
		dbRequest.onsuccess = async function(ev) {
			var idb = ev.target.result;
			var schema = new SchemaBuilder('somedb');
			schema.createStore('foo');
			var db = new Database(schema, idb);
			var repo = new Repository(db, 'foo');
			var tx = repo.getStoreTransaction(db);
			var store = tx.objectStore('foo');
			var getCalled = false;

			repo.setTransaction(tx);

			store.get = function(key) {
				var request : any = {
					onsuccess: function() { console.log('default yield on get()! oh no!'); },
					onerror: function() { console.log('default catch on get()! oh no!'); }
				};

				setTimeout(function() {
					var target = {
						result: {
							id: key
						}
					};
					request.onsuccess({
						target: target,
						currentTarget: target
					});
				}, 1);

				return request;
			};

			var ids = ['123', '321', '1000', 'abcdef'];
			var currentIndex = 0;

			for await (let item of repo.getMany(ids)) {
				expect((<any>item).id).toBe(ids[currentIndex++]);
			}

			done();

		};
	});
});

describe('Repository.cursor()', function() {
	it('should use openCursor()', function(done) {
		
		idbMock.reset();
		var dbRequest = idbMock.mock.open('somedb', 1);
		dbRequest.onsuccess = async function(ev) {
			var idb = ev.target.result;
			var schema = new SchemaBuilder('somedb');
			schema.createStore('foo');
			var db = new Database(schema, idb);
			var repo = new Repository(db, 'foo');
			var tx = repo.getStoreTransaction(db);
			var store = tx.objectStore('foo');
			var getCalled = false;

			repo.setTransaction(tx);

			store.openCursor = function() {
				var request : any = {
					onsuccess: function() { console.log('DEFAULT YIELD'); },
					_finishes: function() { 
						var target = {
							result: null
						};  
						this.onsuccess({target: target, currentTarget: target});
					},
				};

				setTimeout(function() {
					var target = {
						result: {
							value: {
								id: '123'
							},
							"continue": function() { }
						}
					};
					request.onsuccess({
						target: target,
						currentTarget: target
					});
					request._finishes();
				}, 1);

				return request;
			};

			for await (let item of repo.cursor()) {
				// TODO 
				expect((<any>item).id).toBe('123');
			}

			done();
		};
	});
});

describe('Repository.find()', function() {
	
	async function *mockFind(data, criteria) {
		idbMock.reset();
		var dbRequest = idbMock.mock.open('somedb', 1);
		let idb : IDBDatabase;
		let db : Database;

		await new Promise((resolve, reject) => {
			dbRequest.onsuccess = function(ev) {
				idb = ev.target.result;
				resolve();
			};
		});

		db = new Database(new SchemaBuilder('foo'), idb);

		var repo = new Repository(db, 'foo'); 
		var tx = repo.getStoreTransaction(db);
		var store : any = tx.objectStore('foo');

		repo.setTransaction(tx);
			
		store.indexNames = {
			contains: function(field) {
				return true;
			} 
		}; 
		
		store.index = function(key) {
			return {  
				key: key,
				openCursor: function(idb) {
					for (var i = 0, max = data.length; i < max; ++i) {
						data[i]._queriedKey = key; 
					}
		
					return idbMock.request.success(data);
				}
			};
		};

		for await (let item of repo.find(criteria)) {

			yield <any>item;
		}
	}
	
	it('should get the underlying index and use openCursor()', async function(done) {
		
		debugger;

		var count = 0;  
		let iterable = mockFind([
			{id: 1, key: 123, thing: 321},
			{id: 2, key: 123, thing: 111},
			{id: 3, key: 123, thing: 321},
			{id: 4, key: 123, thing: 111}
		], {
			key: 123
		});
		
		for await (let item of iterable) { 
			expect(item.key).toBe(123);
			expect(item._queriedKey).toBe('key');
			++count;
		}

		expect(count).toBe(4);
		done();
	});
	
	it('should do basic filtering on the IDB data set', async function(done) {
		
		var count = 0;
		let iterable = mockFind([
			{id: 1, key: 123, thing: 321},
			{id: 2, key: 123, thing: 111},
			{id: 3, key: 123, thing: 321},
			{id: 4, key: 123, thing: 111}
		], {
			key: 123,
			thing: 111
		});
		
		for await (let item of iterable) {

			expect(item.key).toBe(123);
			expect(item.thing).toBe(111);
			++count;

		}

		expect(count).toBe(2);
		done();
	});
	
	it('should implement greaterThan', async function(done) {
		var count = 0;
		
		let iterable = mockFind([
			{	id: 'asdf', nifty: true, key: 10 }, 
			{	id: 'foobar', nifty: true, key: 121 }, 
			{	id: 'barfoo', nifty: true, key: 123 }
		], 
		function (is) {
			return {
				nifty: true,
				key: is.greaterThan(100),
			}
		});
		
		for await (let item of iterable) {
			expect(item.key > 100).toBe(true);
			++count;
		}

		expect(count).toBe(2);
		done();
	});
	
	it('should implement lessThan', async function(done) {
		var count = 0;
		
		let iterable = mockFind([
			{	id: 'asdf', nifty: true, key: 10 }, 
			{	id: 'foobar', nifty: true, key: 121 }, 
			{	id: 'barfoo', nifty: true, key: 123 }
		], 
		function (is) {
			return {
				nifty: true,
				key: is.lessThan(122),
			}
		});

		for await (let item of iterable) {
			expect(item.key < 122).toBe(true);
			++count;
		}

		expect(count).toBe(2);
		done();
	});
	
	it('should implement greaterThanOrEqualTo', async function(done) {
		var count = 0;
		
		let iterable = mockFind([
			{	id: 'asdf', nifty: true, key: 10 }, 
			{	id: 'foobar', nifty: true, key: 121 }, 
			{	id: 'barfoo', nifty: true, key: 123 }
		], 
		function (is) {
			return {
				nifty: true,
				key: is.greaterThanOrEqualTo(121),
			}
		});
		
		for await (let item of iterable) {
			expect(item.key >= 121).toBe(true);
			++count;
		}

		expect(count).toBe(2);
		done();
	});
	
	it('should implement lessThanOrEqualTo', async function(done) {
		var count = 0;
		
		let iterable = mockFind([
			{	id: 'asdf', nifty: true, key: 10 }, 
			{	id: 'foobar', nifty: true, key: 121 }, 
			{	id: 'barfoo', nifty: true, key: 123 }
		], 
		function (is) {
			return {
				nifty: true,
				key: is.lessThanOrEqualTo(121),
			}
		});

		for await (let item of iterable) {
			expect(item.key <= 121).toBe(true);
			++count;
		}

		expect(count).toBe(2);
		done();
	});
	
	it('should implement in()', async function(done) {
		var count = 0;
		let iterable = mockFind([
			{	id: 'asdf', nifty: true, key: 10 }, 
			{	id: 'foobar', nifty: true, key: 121 }, 
			{	id: 'barfoo', nifty: true, key: 123 }
		], 
		function (is) {
			return {
				nifty: true,
				key: is.in([10, 123]),
			}
		});

		for await (let item of iterable) {
			expect([10, 123].indexOf(item.key) >= 0).toBe(true);
			++count;
		}

		expect(count).toBe(2);
		done();
	});
	
	it('should implement bound()', async function(done) {
		var count = 0;
		let iterable = mockFind([
			{	id: 'asdf', nifty: true, key: 10 }, 
			{	id: 'foobar', nifty: true, key: 121 }, 
			{	id: 'barfoo', nifty: true, key: 123 }
		], 
		function (is) {
			return {
				nifty: true,
				key: is.inBounds(9, 122)
			}
		});

		for await (let item of iterable) {
			expect([10, 121].indexOf(item.key) >= 0).toBe(true);
			++count;
		}

		expect(count).toBe(2);
		done();
	});
	
	it('should implement compound filtering', async function(done) {
		var count = 0;
		
		let iterable = mockFind([
			{	id: 'asdf', nifty: true, key: 10, ala: { mode: 333 } }, 
			{	id: 'foobar', nifty: true, key: 121, ala: {mode: 1 } }, 
			{	id: 'barfoo', nifty: false, key: 123, ala: {mode: 1 } }
		], 
		function (is) {
			return {
				_dummy: 0,
				nifty: true,
				ala: {
					mode: 1
				} 
			}
		})

		for await (let item of iterable) {
			expect(item.id).toBe('foobar');
			++count;
		}

		expect(count).toBe(1);
		done();
	});
	
	it('should implement compound inner constraints', async function(done) {
		var count = 0;
		
		let iterable = mockFind([
			{	id: 'asdf', nifty: true, key: 10, ala: { mode: 333 } }, 
			{	id: 'foobar', nifty: true, key: 121, ala: {mode: 111 } }, 
			{	id: 'barfoo', nifty: false, key: 123, ala: {mode: 222 } }
		], 
		function (is) {
			return {
				_dummy: 0,
				nifty: true,
				ala: {
					mode: is.greaterThanOrEqualTo(111)
				} 
			}
		});

		for await (let item of iterable) {
			expect(item.ala.mode >= 111).toBe(true);
			++count;
		}

		expect(count).toBe(2);
		done();
	});
	
	it('should filter index results', async function(done) {
		var count = 0;
		let iterable = mockFind([
			{
				id: 'asdf',
				wombat: true,
				key: 123
			}, 
			{
				id: 'foobar',
				wombat: true,
				nifty: true,
				key: 123
			}, 
			{
				id: 'barfoo',
				nifty: true,
				key: 123
			}
		], {
			key: 123,
			wombat: true,
			nifty: true
		});

		for await (let item of iterable) {
			expect(item.id).toBe('foobar');
			++count;
		}
	
		done();
	});
});