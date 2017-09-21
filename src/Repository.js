"use strict";
/**
 * Module  which is providing a class which provides a high-level API on top
 * of an IndexedDB object store (IDBObjectStore)
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore MDN Reference - IDBObjectStore}
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti
 */
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
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { Generator } from 'es5-generators';
// import { IDBRequestGenerator } from './IDBRequestGenerator.js';
// import { IDBCursorGenerator } from './IDBCursorGenerator.js';
var strip_copy_1 = require("@dibello/strip-copy");
var transact_1 = require("@dibello/transact");
var database_1 = require("@dibello/database");
var index_1 = require("@dibello/index");
var criteria_finder_1 = require("@dibello/criteria-finder");
var request_to_promise_1 = require("@dibello/utils/idb/request-to-promise");
var request_to_iterable_1 = require("@dibello/utils/idb/request-to-iterable");
/**
 * Provides a high-level API on top of an IndexedDB object store (IDBObjectStore)
 */
var Repository = /** @class */ (function () {
    function Repository(db, storeName, transaction) {
        var self = this;
        if (db instanceof database_1.Database)
            this._ready = Promise.resolve(db);
        else
            this._ready = db;
        this._storeName = storeName;
        this._transaction = transaction ? transaction : null;
    }
    Object.defineProperty(Repository.prototype, "transaction", {
        get: function () { return this._transaction; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Repository.prototype, "storeName", {
        get: function () { return this._storeName; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Repository.prototype, "ready", {
        get: function () { return this._ready; },
        enumerable: true,
        configurable: true
    });
    /**
     * Dehydrates (flattens) the properties of the given object.
     * If the corresponding hydrate() call has fetched associated items and attached them to an item,
     * this method should replace those fetched items with the original IDs so that the item can be persisted
     * back into the object store.
     *
     * This method can be overridden for a specific repository by using
     * {@link module:dibello.Database#configRepository}
     *
     * @param {type} item
     * @see {@link module:dibello/Database~Database#configRepository Database.configRepository}
     * @see {@link module:dibello/Database~Database#transact Database.transact}
     * @returns {undefined}
     */
    Repository.prototype.dehydrate = function (db, item) { };
    ;
    /**
     * Returns a promise to hydrate the properties of a given object.
     * This function is called using dibello/Database.transact(), so you can request
     * repositories or other dependencies using Dibello's function injection mechanism.
     *
     * @see {@link module:dibello/Database~Database#transact Database.transact}
     * @param {type} item In addition to the standard transact services, you may also inject 'item' which is the item being hydrated
     * @returns {unresolved}
     */
    Repository.prototype.hydrate = function (item) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, item];
        }); });
    };
    ;
    /**
     * Get an IndexedDB transaction (IDBTransaction) for only the store represented by
     * this repository. The resulting transaction cannot be used to access any other store.
     *
     * @param {Database} db The Database instance
     * @returns {type|IDBTransaction}
     */
    Repository.prototype.getStoreTransaction = function (db, mode) {
        if (mode === void 0) { mode = 'readwrite'; }
        if (this._transaction)
            return this._transaction;
        return db.idb().transaction([this._storeName], mode);
    };
    /*-*
    * Return a promise to hydrate the given item by
    * transacting this repository's .hydrate() method.
    *
    * @private
    * @param {module:dibello.Database} db Database instance
    * @param {object} item The item being hydrated
    */
    Repository.prototype._hydrateItem = function (db, item) {
        var self = this;
        // Standard hydration
        var schema = db.getSchema();
        var store = schema.getStore(self._storeName);
        var foreignFields = store.getForeignFields();
        return transact_1.transact(db, null, function (db, name, transaction) {
            return db.repository(name, transaction);
        }, self.hydrate, 'readonly', {
            item: item
        });
    };
    ;
    /*-*
    * Dehydrate the given item.
    *
    * @param {type} db
    * @param {type} item
    * @returns {unresolved}
    */
    Repository.prototype._dehydrateItem = function (db, item) {
        this.dehydrate(db, item);
        // Standard dehydration
        return item;
    };
    ;
    /**
     * Generate a GUID which may be used as the ID for a new object.
     * @returns {String} The new GUID
     */
    Repository.generateGuid = function () {
        var result, i, j;
        result = '';
        for (j = 0; j < 32; j++) {
            if (j == 8 || j == 12 || j == 16 || j == 20)
                result = result + '-';
            i = Math.floor(Math.random() * 16).toString(16).toUpperCase();
            result = result + i;
        }
        return result;
    };
    /**
     * Set the transaction on this repository object so that future operations
     * use it instead of creating a new one. This is used during dibello.transact()
     * calls to ensure that a new Repository will use the newly created transaction
     * (amongst other uses).
     */
    Repository.prototype.setTransaction = function (tx) {
        this._transaction = tx;
    };
    ;
    /**
     * On a transacted Repository instance, this method returns the underlying
     * object store instance (IDBObjectStore). If called on a non-transacted
     * Repository (ie one created with {@link module:dibello/Database~Database#repository Database.repository()}),
     * this method will throw an exception.
     *
     * @returns {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore IDBObjectStore}
     */
    Repository.prototype.getStore = function () {
        if (!this._transaction) {
            throw "Cannot get object store for a non-transaction repository";
        }
        return this._transaction.objectStore(this._storeName);
    };
    /**
     * Persist the given item into the object store.
     * Return a promise to resolve once the operation is completed.
     *
     * @param {object} item The object which should be persisted
     * @returns {Promise} Resolves once the operation is completed.
     */
    Repository.prototype.persist = function (item) {
        return __awaiter(this, void 0, void 0, function () {
            var db, clone, tx, store;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ready];
                    case 1:
                        db = _a.sent();
                        clone = this._dehydrateItem(db, strip_copy_1.stripCopy(item));
                        tx = this.getStoreTransaction(db);
                        store = tx.objectStore(this._storeName);
                        return [2 /*return*/, request_to_promise_1.idbRequestToPromise(store.put(clone, clone.id))];
                }
            });
        });
    };
    ;
    /**
     * Promises to return a single item.
     *
     * @param {String} id The ID of the object to fetch
     * @returns {Promise} A promise to return the item
     */
    Repository.prototype.get = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var self, db, tx, store, item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        self = this;
                        return [4 /*yield*/, this.ready];
                    case 1:
                        db = _a.sent();
                        tx = self.getStoreTransaction(db);
                        store = tx.objectStore(self._storeName);
                        return [4 /*yield*/, request_to_promise_1.idbRequestToPromise(store.get(id))];
                    case 2:
                        item = _a.sent();
                        return [2 /*return*/, this._hydrateItem(db, item)];
                }
            });
        });
    };
    ;
    /**
     * Iterate over all items in the object store.
     */
    Repository.prototype.all = function () {
        return __asyncGenerator(this, arguments, function all_1() {
            var _this = this;
            var db, tx, store;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, __await(this.ready)];
                    case 1:
                        db = _a.sent();
                        tx = this.getStoreTransaction(db);
                        store = tx.objectStore(this._storeName);
                        return [2 /*return*/, request_to_iterable_1.idbRequestToIterable(store.openCursor(), function (x) { return _this._hydrateItem(db, x); })];
                }
            });
        });
    };
    ;
    /**
     * Retrieve an index object which allows for querying a specific index.
     *
     * @param {String} name The name of the index to retrieve
     * @returns {Index}
     */
    Repository.prototype.index = function (name) {
        return new index_1.Index(this, name);
    };
    /**
     * Open a cursor on the main index of this object store
     *
     * @param {IDBKeyRange} An optional {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange IDBKeyRange}
     *		instance specifying the range of the query
    */
    Repository.prototype.cursor = function (range) {
        return __asyncGenerator(this, arguments, function cursor_1() {
            var _this = this;
            var db, tx, store;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, __await(this.ready)];
                    case 1:
                        db = _a.sent();
                        tx = this.getStoreTransaction(db);
                        store = tx.objectStore(this._storeName);
                        return [2 /*return*/, request_to_iterable_1.idbRequestToIterable(store.openCursor(range), function (x) { return _this._hydrateItem(db, x); })];
                }
            });
        });
    };
    /**
     * Look up many items with many keys at once.
     * Result is a generator which will emit each of the items.
     * TODO: Can we do this using cursors and key ranges?
     *
     * @param {Array} ids An array of IDs which should be looked up
     * @returns {Generator}
     */
    Repository.prototype.getMany = function (ids, includeNulls) {
        if (includeNulls === void 0) { includeNulls = false; }
        return __asyncGenerator(this, arguments, function getMany_1() {
            var db, tx, store, ids_1, ids_1_1, id, rawItem, e_1, e_2_1, e_2, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, __await(this.ready)];
                    case 1:
                        db = _b.sent();
                        tx = this.getStoreTransaction(db);
                        store = tx.objectStore(this._storeName);
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 11, 12, 13]);
                        ids_1 = __values(ids), ids_1_1 = ids_1.next();
                        _b.label = 3;
                    case 3:
                        if (!!ids_1_1.done) return [3 /*break*/, 10];
                        id = ids_1_1.value;
                        rawItem = null;
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, __await(request_to_promise_1.idbRequestToPromise(store.get(id)))];
                    case 5:
                        rawItem = _b.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        e_1 = _b.sent();
                        if (!includeNulls)
                            return [3 /*break*/, 9];
                        return [3 /*break*/, 7];
                    case 7: return [4 /*yield*/, this._hydrateItem(db, rawItem)];
                    case 8:
                        _b.sent();
                        _b.label = 9;
                    case 9:
                        ids_1_1 = ids_1.next();
                        return [3 /*break*/, 3];
                    case 10: return [3 /*break*/, 13];
                    case 11:
                        e_2_1 = _b.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 13];
                    case 12:
                        try {
                            if (ids_1_1 && !ids_1_1.done && (_a = ids_1.return)) _a.call(ids_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    ;
    /**
     * Find all objects which match a given criteria object.
     * This is "query by example".
     *
     * Performance: For best performance, define the most-specific
     * key first. This is because the first key found in the criteria
     * object will be used to do the actual database query. The result of
     * this query will be stored in memory, then all subsequent
     * keys will filter the result set until the final result is obtained.
     *
     * @param {object} criteria An object containing key/value pairs to search for. The first
     *		key/value pair is used as an index.
    * @returns {Promise} A promise to return the matching items
    */
    Repository.prototype.find = function (criteria) {
        var finder = new criteria_finder_1.CriteriaFinder(this);
        return finder.find(criteria);
    };
    ;
    /**
     * Promises to resolve once the item has been deleted.
     *
     * @param {String} id The ID of the object to delete
     * @returns {Promise} A promise to resolve once the item has been deleted.
     */
    Repository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db, tx, store;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ready];
                    case 1:
                        db = _a.sent();
                        tx = this.getStoreTransaction(db);
                        store = tx.objectStore(this.storeName);
                        return [2 /*return*/, request_to_promise_1.idbRequestToPromise(store.delete(id))];
                }
            });
        });
    };
    return Repository;
}());
exports.Repository = Repository;
