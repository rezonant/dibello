
var Repository = require('../src/Repository.js');
function mockedDB(options) {
	
	if (!options)
		options = {};
	
	var stores = {};
	
	function createObjectStore(name) {
		if (stores[name])
			return stores[name];
		
		if (this._stores && this._stores.indexOf(name) < 0) {
			throw {
				error: 'no-such-store',
				message: 'Invalid store name for this transaction!'
			};
		}
		
		var tx = this;
		return stores[name] = {
			_name: name,
			_tx: tx,
			_itemsPut: [],

			put: function(item, key) {
				this._itemsPut.push({
					item: item,
					key: key
				});

				var request = {
					_succeeds: function() {
						console.log('Default succeeds! No one got it!');
					},
					_catch: function() {
						console.log('Default catch! No one got it!');
					},
					succeeds: function(x) { this._succeeds = x; },
					catch: function(x) { this._catch = x; }
				};

				setTimeout(function() {
					if (typeof options.putFails !== 'undefined')
						request._catch(options.putFails);
					else {
						request._succeeds();
					}
				}, 1);
				
				return request;
			}
		};	
	}
	
	return {
		transaction: function(stores, mode) {
			return {
				_stores: stores,
				_mode: mode,
				objectStore: createObjectStore
			};
		}
	};
}

describe('Repository.getStoreTransaction()', function() {
	
	it('should return a new transaction', function(done) {
		var repo = new Repository(mockedDB(), 'foo');
		var tx = repo.getStoreTransaction(mockedDB(), 'readwrite');
		
		expect(tx._stores.length).toBe(1);
		expect(tx._stores).toContain('foo'); 
		expect(tx._mode).toBe('readwrite'); 
		done();
	});
});

describe('Repository.setTransaction()', function() {
	
	it('should set the active transaction on the repository', function(done) {
		var repo = new Repository(mockedDB(), 'foo');
		var tx = {_stores: []};
		
		repo.setTransaction(tx);
		expect(repo.transaction).toBe(tx);
		done();
	});
	it('should cause getStoreTransaction() to return the set transaction', function(done) {
		var repo = new Repository(mockedDB(), 'foo');
		var tx = {_stores: []};
		
		repo.setTransaction(tx);
		expect(repo.getStoreTransaction(mockedDB)).toBe(tx);
		done();
	});
});
describe('Repository.persist()', function() {
	
	it('should call the underlying store.put() method', function(done) {
		var db = mockedDB();
		var repo = new Repository(db, 'foo');
		var tx = repo.getStoreTransaction(db);
		
		repo.setTransaction(tx);	 
		repo.persist({ id: '123', foo: 'bar' }, '123').then(function() {

			var store = tx.objectStore('foo');
			expect(store._itemsPut.length).toBe(1);
			expect(store._itemsPut[0].key).toBe('123');
			expect(store._itemsPut[0].item.foo).toBe('bar');
			done();
		});
		
	});
});
describe('Repository.get()', function() {
	
	it('should call the underlying store.get() method', function(done) {
		var db = mockedDB();
		var repo = new Repository(db, 'foo');
		var tx = repo.getStoreTransaction(db);
		var store = tx.objectStore('foo');
		var getCalled = false;
		
		store.get = function(key) {
			getCalled = true;
			expect(key).toBe('123');
			
			var request = {
				yield: function(cb) { this._yield = cb; }
			};
			
			setTimeout(function() {
				request._yield({
					id: '123'
				});
			}, 1);
			
			return request;
		};
		
		repo.setTransaction(tx);	 
		repo.get('123').then(function(item) {
			expect(item.id).toBe('123');
			expect(getCalled).toBe(true);
			done();
		});
		
	});
});
describe('Repository.all()', function() {
	
	it('should call the underlying store.openCursor() method', function(done) {
		var db = mockedDB();
		var repo = new Repository(db, 'foo');
		var tx = repo.getStoreTransaction(db);
		var store = tx.objectStore('foo');
		var getCalled = false;
		
		repo.setTransaction(tx);
		
		store.openCursor = function() {
			var request = {
				_yield: function() { console.log('DEFAULT YIELD'); },
				_finishes: function() { console.log('DEFAULT FINISH'); },
				yield: function(cb) { this._yield = cb; return this; },
				finishes: function(cb) { this._finishes = cb; return this; }
			};
			
			setTimeout(function() {
				request._yield({
					id: '123'
				});
				request._finishes();
			}, 1);
			
			return request;
		};
		
		repo.all().emit(function(item) {
			expect(item.id).toBe('123');
		}).done(function() {
			done();
		});
		
	});
});

describe('Repository.getMany()', function() {
	
	it('should call the underlying store.get() method', function(done) {
		var db = mockedDB();
		var repo = new Repository(db, 'foo');
		var tx = repo.getStoreTransaction(db);
		var store = tx.objectStore('foo');
		var getCalled = false;
		
		repo.setTransaction(tx);
		
		store.get = function(key) {
			var request = {
				_yield: function() { console.log('default yield on get()! oh no!'); },
				"yield": function(cb) { this._yield = cb; return this; },
				_catch: function() { console.log('default catch on get()! oh no!'); },
				catch: function(cb) { this._catch = cb; return this; }, 
			};
			
			setTimeout(function() {
				request._yield.call(null, {
					id: key
				});
			}, 1);
			
			return request;
		};
		
		var ids = ['123', '321', '1000', 'abcdef'];
		var currentIndex = 0;
		
		repo.getMany(ids).emit(function(item) {
			expect(item.id).toBe(ids[currentIndex++]);
		}).done(function() {
			done();
		});
		
	});
});


describe('Repository.find()', function() {
	
	it('should get the underlying index and use openCursor()', function(done) {
		var db = mockedDB();
		var repo = new Repository(db, 'foo');
		var tx = repo.getStoreTransaction(db);
		var store = tx.objectStore('foo');
		var getCalled = false;
		
		repo.setTransaction(tx);
		
		store.indexNames = {
			contains: function(field) {
				return true;
			}
		};
		store.index = function(key) {
			return {
				key: key,
				openCursor: function(key) {
					var request = {
						_yield: function() { },
						_catch: function() { },
						_finishes: function() { },
						
						yield: function(cb) { this._yield = cb; return this; },
						catch: function(cb) { this._catch = cb; return this; }, 
						finishes: function(cb) { this._finishes = cb; return this; }
					};

					setTimeout(function() {
						request._yield.call(null, {
							id: 'foobar',
							key: key
						});
						
						request._finishes.call(null);
					}, 1);

					return request;
				}
			};
		}
		
		repo.find({key:123}).emit(function(item) {
			expect(item.key).toBe(123);
		}).done(function() {
			done();
		});
		
	});
	it('should filter index results', function(done) {
		var db = mockedDB();
		var repo = new Repository(db, 'foo');
		var tx = repo.getStoreTransaction(db);
		var store = tx.objectStore('foo');
		var getCalled = false;
		
		repo.setTransaction(tx);
		
		store.indexNames = {
			contains: function(field) {
				return true;
			}
		};
		store.index = function(key) {
			return {
				key: key,
				openCursor: function(key) {
					var request = {
						_yield: function() { },
						_catch: function() { },
						_finishes: function() { },
						
						yield: function(cb) { this._yield = cb; return this; },
						catch: function(cb) { this._catch = cb; return this; }, 
						finishes: function(cb) { this._finishes = cb; return this; }
					};

					setTimeout(function() {
						request._yield.call(null, {
							id: 'asdf',
							wombat: true,
							key: 123
						});
						request._yield.call(null, {
							id: 'foobar',
							wombat: true,
							nifty: true,
							key: 123
						});
						request._yield.call(null, {
							id: 'barfoo',
							nifty: true,
							key: 123
						});
						
						request._finishes.call(null);
					}, 1);

					return request;
				}
			};
		}
		
		repo.find({
			key:123,
			wombat: true,
			nifty: true
		}).emit(function(item) {
			expect(item.id).toBe('foobar');
		}).done(function() {
			done();
		});
		
	});
});