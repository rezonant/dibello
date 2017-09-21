"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncIterator) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator];
    return m ? m.call(o) : typeof __values === "function" ? __values(o) : o[Symbol.iterator]();
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var repository_1 = require("@dibello/repository");
var database_1 = require("@dibello/database");
var schema_builder_1 = require("@dibello/schema-builder");
// import { Generator } from 'es5-generators';
var idbMock = require("indexeddb-mock");
describe('Repository.getStoreTransaction()', function () {
    it('should return a new transaction', function (done) {
        idbMock.reset();
        var dbRequest = idbMock.mock.open('somedb', 1);
        dbRequest.onsuccess = function (ev) {
            var idb = ev.target.result;
            var db = new database_1.Database(new schema_builder_1.SchemaBuilder('foo'), idb);
            var repo = new repository_1.Repository(db, 'foo');
            var tx = repo.getStoreTransaction(db, 'readwrite');
            expect(tx._stores.length).toBe(1);
            expect(tx._stores).toContain('foo');
            expect(tx._mode).toBe('readwrite');
            done();
        };
    });
});
describe('Repository.generateGuid()', function () {
    it('should generate a decently long string', function () {
        var guid = repository_1.Repository.generateGuid();
        expect(guid.length > 10).toBe(true);
    });
});
describe('Repository.index()', function () {
    it('should work', function (done) {
        idbMock.reset();
        var dbRequest = idbMock.mock.open('somedb', 1);
        dbRequest.onsuccess = function (ev) {
            var idb = ev.target.result;
            var db = new database_1.Database(new schema_builder_1.SchemaBuilder('foo'), idb);
            var repo = new repository_1.Repository(db, 'foo');
            var index = repo.index('foo');
            expect(typeof index).toBe('object');
            done();
        };
    });
});
describe('Repository.setTransaction()', function () {
    it('should set the active transaction on the repository', function (done) {
        idbMock.reset();
        var dbRequest = idbMock.mock.open('somedb', 1);
        dbRequest.onsuccess = function (ev) {
            var db = ev.target.result;
            var repo = new repository_1.Repository(new database_1.Database(new schema_builder_1.SchemaBuilder('foo'), db), 'foo');
            var tx = { _stores: [] };
            repo.setTransaction(tx);
            expect(repo._transaction).toBe(tx);
            done();
        };
    });
    it('should cause getStoreTransaction() to return the set transaction', function (done) {
        idbMock.reset();
        var dbRequest = idbMock.mock.open('somedb', 1);
        dbRequest.onsuccess = function (ev) {
            var idb = ev.target.result;
            var db = new database_1.Database(new schema_builder_1.SchemaBuilder('foo'), db);
            var repo = new repository_1.Repository(db, 'foo');
            var tx = { _stores: [] };
            repo.setTransaction(tx);
            expect(repo.getStoreTransaction(db)).toBe(tx);
            done();
        };
    });
});
describe('Repository.persist()', function () {
    it('should call the underlying store.put() method', function (done) {
        idbMock.reset();
        var dbRequest = idbMock.mock.open('somedb', 1);
        dbRequest.onsuccess = function (ev) {
            var idb = ev.target.result;
            var db = new database_1.Database(new schema_builder_1.SchemaBuilder('foo'), idb);
            var repo = new repository_1.Repository(db, 'foo');
            var tx = repo.getStoreTransaction(db);
            repo.setTransaction(tx);
            repo.persist({ id: '123', foo: 'bar' }).then(function () {
                var store = tx.objectStore('foo');
                expect(store._itemsPut.length).toBe(1);
                expect(store._itemsPut[0].key).toBe('123');
                expect(store._itemsPut[0].item.foo).toBe('bar');
                done();
            });
        };
    });
});
describe('Repository.get()', function () {
    it('should call the underlying store.get() method', function (done) {
        idbMock.reset();
        var dbRequest = idbMock.mock.open('somedb', 1);
        dbRequest.onsuccess = function (ev) {
            var idb = ev.target.result;
            var schema = new schema_builder_1.SchemaBuilder('foo');
            schema.createStore('foo');
            var db = new database_1.Database(schema, idb);
            var repo = new repository_1.Repository(db, 'foo');
            var tx = repo.getStoreTransaction(db);
            var getCalled = false;
            tx.objectStore('foo').get = function (key) {
                getCalled = true;
                expect(key).toBe('123');
                return idbMock.request.success({ id: '123' }, true);
            };
            repo.setTransaction(tx);
            repo.get('123').then(function (item) {
                expect(item.id).toBe('123');
                expect(getCalled).toBe(true);
                done();
            });
        };
    });
});
describe('Repository.index()', function () {
    it('should call the underlying store.index() method', function (done) {
        if (true == true) {
            done();
            return;
        }
        ; // TODO
        idbMock.reset();
        var dbRequest = idbMock.mock.open('somedb', 1);
        dbRequest.onsuccess = function (ev) {
            var idb = ev.target.result;
            var schema = new schema_builder_1.SchemaBuilder('foo');
            schema.createStore('foo');
            var db = new database_1.Database(schema, idb);
            var repo = new repository_1.Repository(db, 'foo');
            var tx = repo.getStoreTransaction(db);
            var getCalled = false;
            tx.objectStore('foo').index = function (key) {
                getCalled = true;
                expect(key).toBe('123');
                return idbMock.request.success([
                    { id: '123' }
                ], true);
            };
            repo.setTransaction(tx);
            repo.get('123').then(function (item) {
                expect(item.id).toBe('123');
                expect(getCalled).toBe(true);
                done();
            });
        };
    });
});
describe('Repository.all()', function () {
    it('should call the underlying store.openCursor() method', function (done) {
        idbMock.reset();
        var dbRequest = idbMock.mock.open('somedb', 1);
        dbRequest.onsuccess = function (ev) {
            return __awaiter(this, void 0, void 0, function () {
                var idb, schema, db, repo, tx, store, getCalled, count, _a, _b, item, e_1_1, e_1, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            idb = ev.target.result;
                            schema = new schema_builder_1.SchemaBuilder('foo');
                            schema.createStore('foo');
                            db = new database_1.Database(schema, idb);
                            repo = new repository_1.Repository(db, 'foo');
                            tx = repo.getStoreTransaction(db);
                            store = tx.objectStore('foo');
                            getCalled = false;
                            repo.setTransaction(tx);
                            store.openCursor = function () {
                                console.log('OPENCURSOR CALLED');
                                var request = {
                                    onsuccess: function () { console.log('BUG: DEFAULT YIELD CALLED'); },
                                    _finishes: function () {
                                        var target = {
                                            result: null
                                        };
                                        this.onsuccess({ target: target, currentTarget: target });
                                    },
                                };
                                setTimeout(function () {
                                    var target = {
                                        result: {
                                            value: {
                                                id: '123'
                                            },
                                            "continue": function () { }
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
                            console.log('CALLING ALL()');
                            count = 0;
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 7, 8, 13]);
                            _a = __asyncValues(repo.all());
                            _d.label = 2;
                        case 2: return [4 /*yield*/, _a.next()];
                        case 3:
                            if (!(_b = _d.sent(), !_b.done)) return [3 /*break*/, 6];
                            return [4 /*yield*/, _b.value];
                        case 4:
                            item = _d.sent();
                            // TODO
                            console.log('ITEM FOUND');
                            expect(item.id).toBe('123');
                            ++count;
                            _d.label = 5;
                        case 5: return [3 /*break*/, 2];
                        case 6: return [3 /*break*/, 13];
                        case 7:
                            e_1_1 = _d.sent();
                            e_1 = { error: e_1_1 };
                            return [3 /*break*/, 13];
                        case 8:
                            _d.trys.push([8, , 11, 12]);
                            if (!(_b && !_b.done && (_c = _a.return))) return [3 /*break*/, 10];
                            return [4 /*yield*/, _c.call(_a)];
                        case 9:
                            _d.sent();
                            _d.label = 10;
                        case 10: return [3 /*break*/, 12];
                        case 11:
                            if (e_1) throw e_1.error;
                            return [7 /*endfinally*/];
                        case 12: return [7 /*endfinally*/];
                        case 13:
                            console.log('ALL() IS DONE. HOPE YOU GOT WHAT YOU NEED');
                            expect(count).toBe(1);
                            done();
                            return [2 /*return*/];
                    }
                });
            });
        };
    });
});
describe('Repository.getMany()', function () {
    it('should call the underlying store.get() method', function (done) {
        idbMock.reset();
        var dbRequest = idbMock.mock.open('somedb', 1);
        dbRequest.onsuccess = function (ev) {
            return __awaiter(this, void 0, void 0, function () {
                var idb, schema, db, repo, tx, store, getCalled, ids, currentIndex, _a, _b, item, e_2_1, e_2, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            idb = ev.target.result;
                            schema = new schema_builder_1.SchemaBuilder('somedb');
                            schema.createStore('foo');
                            db = new database_1.Database(schema, idb);
                            repo = new repository_1.Repository(db, 'foo');
                            tx = repo.getStoreTransaction(db);
                            store = tx.objectStore('foo');
                            getCalled = false;
                            repo.setTransaction(tx);
                            store.get = function (key) {
                                var request = {
                                    onsuccess: function () { console.log('default yield on get()! oh no!'); },
                                    onerror: function () { console.log('default catch on get()! oh no!'); }
                                };
                                setTimeout(function () {
                                    var target = {
                                        result: {
                                            value: {
                                                id: key
                                            },
                                            "continue": function () { }
                                        }
                                    };
                                    request.onsuccess({
                                        target: target,
                                        currentTarget: target
                                    });
                                }, 1);
                                return request;
                            };
                            ids = ['123', '321', '1000', 'abcdef'];
                            currentIndex = 0;
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 7, 8, 13]);
                            _a = __asyncValues(repo.getMany(ids));
                            _d.label = 2;
                        case 2: return [4 /*yield*/, _a.next()];
                        case 3:
                            if (!(_b = _d.sent(), !_b.done)) return [3 /*break*/, 6];
                            return [4 /*yield*/, _b.value];
                        case 4:
                            item = _d.sent();
                            // TODO
                            expect(item.id).toBe(ids[currentIndex++]);
                            _d.label = 5;
                        case 5: return [3 /*break*/, 2];
                        case 6: return [3 /*break*/, 13];
                        case 7:
                            e_2_1 = _d.sent();
                            e_2 = { error: e_2_1 };
                            return [3 /*break*/, 13];
                        case 8:
                            _d.trys.push([8, , 11, 12]);
                            if (!(_b && !_b.done && (_c = _a.return))) return [3 /*break*/, 10];
                            return [4 /*yield*/, _c.call(_a)];
                        case 9:
                            _d.sent();
                            _d.label = 10;
                        case 10: return [3 /*break*/, 12];
                        case 11:
                            if (e_2) throw e_2.error;
                            return [7 /*endfinally*/];
                        case 12: return [7 /*endfinally*/];
                        case 13:
                            done();
                            return [2 /*return*/];
                    }
                });
            });
        };
    });
});
describe('Repository.cursor()', function () {
    it('should use openCursor()', function (done) {
        idbMock.reset();
        var dbRequest = idbMock.mock.open('somedb', 1);
        dbRequest.onsuccess = function (ev) {
            return __awaiter(this, void 0, void 0, function () {
                var idb, schema, db, repo, tx, store, getCalled, _a, _b, item, e_3_1, e_3, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            idb = ev.target.result;
                            schema = new schema_builder_1.SchemaBuilder('somedb');
                            schema.createStore('foo');
                            db = new database_1.Database(schema, idb);
                            repo = new repository_1.Repository(db, 'foo');
                            tx = repo.getStoreTransaction(db);
                            store = tx.objectStore('foo');
                            getCalled = false;
                            repo.setTransaction(tx);
                            store.openCursor = function () {
                                var request = {
                                    onsuccess: function () { console.log('DEFAULT YIELD'); },
                                    _finishes: function () {
                                        var target = {
                                            result: null
                                        };
                                        this.onsuccess({ target: target, currentTarget: target });
                                    },
                                };
                                setTimeout(function () {
                                    var target = {
                                        result: {
                                            value: {
                                                id: '123'
                                            },
                                            "continue": function () { }
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
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 7, 8, 13]);
                            _a = __asyncValues(repo.cursor());
                            _d.label = 2;
                        case 2: return [4 /*yield*/, _a.next()];
                        case 3:
                            if (!(_b = _d.sent(), !_b.done)) return [3 /*break*/, 6];
                            return [4 /*yield*/, _b.value];
                        case 4:
                            item = _d.sent();
                            // TODO 
                            expect(item.id).toBe('123');
                            _d.label = 5;
                        case 5: return [3 /*break*/, 2];
                        case 6: return [3 /*break*/, 13];
                        case 7:
                            e_3_1 = _d.sent();
                            e_3 = { error: e_3_1 };
                            return [3 /*break*/, 13];
                        case 8:
                            _d.trys.push([8, , 11, 12]);
                            if (!(_b && !_b.done && (_c = _a.return))) return [3 /*break*/, 10];
                            return [4 /*yield*/, _c.call(_a)];
                        case 9:
                            _d.sent();
                            _d.label = 10;
                        case 10: return [3 /*break*/, 12];
                        case 11:
                            if (e_3) throw e_3.error;
                            return [7 /*endfinally*/];
                        case 12: return [7 /*endfinally*/];
                        case 13:
                            done();
                            return [2 /*return*/];
                    }
                });
            });
        };
    });
});
describe('Repository.find()', function () {
    function mockFind(data, criteria) {
        return __asyncGenerator(this, arguments, function mockFind_1() {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    }
    it('should get the underlying index and use openCursor()', function (done) {
        return __awaiter(this, void 0, void 0, function () {
            var count, iterable, iterable_1, iterable_1_1, item, e_4_1, e_4, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        count = 0;
                        iterable = mockFind([
                            { id: 1, key: 123, thing: 321 },
                            { id: 2, key: 123, thing: 111 },
                            { id: 3, key: 123, thing: 321 },
                            { id: 4, key: 123, thing: 111 }
                        ], {
                            key: 123
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 13]);
                        iterable_1 = __asyncValues(iterable);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, iterable_1.next()];
                    case 3:
                        if (!(iterable_1_1 = _b.sent(), !iterable_1_1.done)) return [3 /*break*/, 6];
                        return [4 /*yield*/, iterable_1_1.value];
                    case 4:
                        item = _b.sent();
                        expect(item.key).toBe(123);
                        expect(item._queriedKey).toBe('key');
                        ++count;
                        _b.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_4_1 = _b.sent();
                        e_4 = { error: e_4_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(iterable_1)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_4) throw e_4.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        expect(count).toBe(4);
                        done();
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should do basic filtering on the IDB data set', function (done) {
        return __awaiter(this, void 0, void 0, function () {
            var count, iterable, iterable_2, iterable_2_1, item, e_5_1, e_5, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        count = 0;
                        iterable = mockFind([
                            { id: 1, key: 123, thing: 321 },
                            { id: 2, key: 123, thing: 111 },
                            { id: 3, key: 123, thing: 321 },
                            { id: 4, key: 123, thing: 111 }
                        ], {
                            _dummy: 0,
                            key: 123,
                            thing: 111
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 13]);
                        iterable_2 = __asyncValues(iterable);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, iterable_2.next()];
                    case 3:
                        if (!(iterable_2_1 = _b.sent(), !iterable_2_1.done)) return [3 /*break*/, 6];
                        return [4 /*yield*/, iterable_2_1.value];
                    case 4:
                        item = _b.sent();
                        expect(item.key).toBe(123);
                        expect(item.thing).toBe(111);
                        ++count;
                        _b.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_5_1 = _b.sent();
                        e_5 = { error: e_5_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(iterable_2_1 && !iterable_2_1.done && (_a = iterable_2.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(iterable_2)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_5) throw e_5.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        expect(count).toBe(2);
                        done();
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should implement greaterThan', function (done) {
        return __awaiter(this, void 0, void 0, function () {
            var count, iterable, iterable_3, iterable_3_1, item, e_6_1, e_6, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        count = 0;
                        iterable = mockFind([
                            { id: 'asdf', nifty: true, key: 10 },
                            { id: 'foobar', nifty: true, key: 121 },
                            { id: 'barfoo', nifty: true, key: 123 }
                        ], function (is) {
                            return {
                                nifty: true,
                                key: is.greaterThan(100),
                            };
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 13]);
                        iterable_3 = __asyncValues(iterable);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, iterable_3.next()];
                    case 3:
                        if (!(iterable_3_1 = _b.sent(), !iterable_3_1.done)) return [3 /*break*/, 6];
                        return [4 /*yield*/, iterable_3_1.value];
                    case 4:
                        item = _b.sent();
                        expect(item.key > 100).toBe(true);
                        ++count;
                        _b.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_6_1 = _b.sent();
                        e_6 = { error: e_6_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(iterable_3_1 && !iterable_3_1.done && (_a = iterable_3.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(iterable_3)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_6) throw e_6.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        expect(count).toBe(2);
                        done();
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should implement lessThan', function (done) {
        return __awaiter(this, void 0, void 0, function () {
            var count, iterable, iterable_4, iterable_4_1, item, e_7_1, e_7, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        count = 0;
                        iterable = mockFind([
                            { id: 'asdf', nifty: true, key: 10 },
                            { id: 'foobar', nifty: true, key: 121 },
                            { id: 'barfoo', nifty: true, key: 123 }
                        ], function (is) {
                            return {
                                nifty: true,
                                key: is.lessThan(122),
                            };
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 13]);
                        iterable_4 = __asyncValues(iterable);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, iterable_4.next()];
                    case 3:
                        if (!(iterable_4_1 = _b.sent(), !iterable_4_1.done)) return [3 /*break*/, 6];
                        return [4 /*yield*/, iterable_4_1.value];
                    case 4:
                        item = _b.sent();
                        expect(item.key < 122).toBe(true);
                        ++count;
                        _b.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_7_1 = _b.sent();
                        e_7 = { error: e_7_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(iterable_4_1 && !iterable_4_1.done && (_a = iterable_4.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(iterable_4)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_7) throw e_7.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        expect(count).toBe(2);
                        done();
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should implement greaterThanOrEqualTo', function (done) {
        return __awaiter(this, void 0, void 0, function () {
            var count, iterable, iterable_5, iterable_5_1, item, e_8_1, e_8, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        count = 0;
                        iterable = mockFind([
                            { id: 'asdf', nifty: true, key: 10 },
                            { id: 'foobar', nifty: true, key: 121 },
                            { id: 'barfoo', nifty: true, key: 123 }
                        ], function (is) {
                            return {
                                nifty: true,
                                key: is.greaterThanOrEqualTo(121),
                            };
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 13]);
                        iterable_5 = __asyncValues(iterable);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, iterable_5.next()];
                    case 3:
                        if (!(iterable_5_1 = _b.sent(), !iterable_5_1.done)) return [3 /*break*/, 6];
                        return [4 /*yield*/, iterable_5_1.value];
                    case 4:
                        item = _b.sent();
                        expect(item.key >= 121).toBe(true);
                        ++count;
                        _b.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_8_1 = _b.sent();
                        e_8 = { error: e_8_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(iterable_5_1 && !iterable_5_1.done && (_a = iterable_5.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(iterable_5)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_8) throw e_8.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        expect(count).toBe(2);
                        done();
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should implement lessThanOrEqualTo', function (done) {
        return __awaiter(this, void 0, void 0, function () {
            var count, iterable, iterable_6, iterable_6_1, item, e_9_1, e_9, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        count = 0;
                        iterable = mockFind([
                            { id: 'asdf', nifty: true, key: 10 },
                            { id: 'foobar', nifty: true, key: 121 },
                            { id: 'barfoo', nifty: true, key: 123 }
                        ], function (is) {
                            return {
                                nifty: true,
                                key: is.lessThanOrEqualTo(121),
                            };
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 13]);
                        iterable_6 = __asyncValues(iterable);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, iterable_6.next()];
                    case 3:
                        if (!(iterable_6_1 = _b.sent(), !iterable_6_1.done)) return [3 /*break*/, 6];
                        return [4 /*yield*/, iterable_6_1.value];
                    case 4:
                        item = _b.sent();
                        expect(item.key <= 121).toBe(true);
                        ++count;
                        _b.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_9_1 = _b.sent();
                        e_9 = { error: e_9_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(iterable_6_1 && !iterable_6_1.done && (_a = iterable_6.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(iterable_6)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_9) throw e_9.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        expect(count).toBe(2);
                        done();
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should implement in()', function (done) {
        return __awaiter(this, void 0, void 0, function () {
            var count, iterable, iterable_7, iterable_7_1, item, e_10_1, e_10, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        count = 0;
                        iterable = mockFind([
                            { id: 'asdf', nifty: true, key: 10 },
                            { id: 'foobar', nifty: true, key: 121 },
                            { id: 'barfoo', nifty: true, key: 123 }
                        ], function (is) {
                            return {
                                nifty: true,
                                key: is.in([10, 123]),
                            };
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 13]);
                        iterable_7 = __asyncValues(iterable);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, iterable_7.next()];
                    case 3:
                        if (!(iterable_7_1 = _b.sent(), !iterable_7_1.done)) return [3 /*break*/, 6];
                        return [4 /*yield*/, iterable_7_1.value];
                    case 4:
                        item = _b.sent();
                        expect([10, 123].indexOf(item.key) >= 0).toBe(true);
                        ++count;
                        _b.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_10_1 = _b.sent();
                        e_10 = { error: e_10_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(iterable_7_1 && !iterable_7_1.done && (_a = iterable_7.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(iterable_7)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_10) throw e_10.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        expect(count).toBe(2);
                        done();
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should implement bound()', function (done) {
        return __awaiter(this, void 0, void 0, function () {
            var count, iterable, iterable_8, iterable_8_1, item, e_11_1, e_11, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        count = 0;
                        iterable = mockFind([
                            { id: 'asdf', nifty: true, key: 10 },
                            { id: 'foobar', nifty: true, key: 121 },
                            { id: 'barfoo', nifty: true, key: 123 }
                        ], function (is) {
                            return {
                                nifty: true,
                                key: is.inBounds(9, 122)
                            };
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 13]);
                        iterable_8 = __asyncValues(iterable);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, iterable_8.next()];
                    case 3:
                        if (!(iterable_8_1 = _b.sent(), !iterable_8_1.done)) return [3 /*break*/, 6];
                        return [4 /*yield*/, iterable_8_1.value];
                    case 4:
                        item = _b.sent();
                        expect([10, 121].indexOf(item.key) >= 0).toBe(true);
                        ++count;
                        _b.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_11_1 = _b.sent();
                        e_11 = { error: e_11_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(iterable_8_1 && !iterable_8_1.done && (_a = iterable_8.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(iterable_8)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_11) throw e_11.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        expect(count).toBe(2);
                        done();
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should implement simple compound filtering', function (done) {
        return __awaiter(this, void 0, void 0, function () {
            var count, iterable, iterable_9, iterable_9_1, item, e_12_1, e_12, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        count = 0;
                        iterable = mockFind([
                            { id: 'asdf', nifty: true, key: 10, ala: { mode: 333 } },
                            { id: 'foobar', nifty: true, key: 121, ala: { mode: 1 } },
                            { id: 'barfoo', nifty: false, key: 123, ala: { mode: 1 } }
                        ], function (is) {
                            return {
                                _dummy: 0,
                                nifty: true,
                                ala: {
                                    mode: 1
                                }
                            };
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 13]);
                        iterable_9 = __asyncValues(iterable);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, iterable_9.next()];
                    case 3:
                        if (!(iterable_9_1 = _b.sent(), !iterable_9_1.done)) return [3 /*break*/, 6];
                        return [4 /*yield*/, iterable_9_1.value];
                    case 4:
                        item = _b.sent();
                        expect(item.id).toBe('foobar');
                        ++count;
                        _b.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_12_1 = _b.sent();
                        e_12 = { error: e_12_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(iterable_9_1 && !iterable_9_1.done && (_a = iterable_9.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(iterable_9)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_12) throw e_12.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        expect(count).toBe(1);
                        done();
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should implement compound inner constraints', function (done) {
        return __awaiter(this, void 0, void 0, function () {
            var count, iterable, iterable_10, iterable_10_1, item, e_13_1, e_13, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        count = 0;
                        iterable = mockFind([
                            { id: 'asdf', nifty: true, key: 10, ala: { mode: 333 } },
                            { id: 'foobar', nifty: true, key: 121, ala: { mode: 111 } },
                            { id: 'barfoo', nifty: false, key: 123, ala: { mode: 222 } }
                        ], function (is) {
                            return {
                                _dummy: 0,
                                nifty: true,
                                ala: {
                                    mode: is.greaterThanOrEqualTo(111)
                                }
                            };
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 13]);
                        iterable_10 = __asyncValues(iterable);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, iterable_10.next()];
                    case 3:
                        if (!(iterable_10_1 = _b.sent(), !iterable_10_1.done)) return [3 /*break*/, 6];
                        return [4 /*yield*/, iterable_10_1.value];
                    case 4:
                        item = _b.sent();
                        expect(item.ala.mode >= 111).toBe(true);
                        ++count;
                        _b.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_13_1 = _b.sent();
                        e_13 = { error: e_13_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(iterable_10_1 && !iterable_10_1.done && (_a = iterable_10.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(iterable_10)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_13) throw e_13.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        expect(count).toBe(2);
                        done();
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should filter index results', function (done) {
        return __awaiter(this, void 0, void 0, function () {
            var count, iterable, iterable_11, iterable_11_1, item, e_14_1, e_14, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        count = 0;
                        iterable = mockFind([
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
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 13]);
                        iterable_11 = __asyncValues(iterable);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, iterable_11.next()];
                    case 3:
                        if (!(iterable_11_1 = _b.sent(), !iterable_11_1.done)) return [3 /*break*/, 6];
                        return [4 /*yield*/, iterable_11_1.value];
                    case 4:
                        item = _b.sent();
                        expect(item.id).toBe('foobar');
                        ++count;
                        _b.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_14_1 = _b.sent();
                        e_14 = { error: e_14_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(iterable_11_1 && !iterable_11_1.done && (_a = iterable_11.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(iterable_11)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_14) throw e_14.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        done();
                        return [2 /*return*/];
                }
            });
        });
    });
});
