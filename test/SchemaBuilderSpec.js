"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var idbMock = require("indexeddb-mock");
var schema_builder_1 = require("@dibello/schema-builder");
var database_1 = require("@dibello/database");
describe("SchemaBuilder", function () {
    it("should throw when requesting a store that doesn't exist", function (done) {
        var builder = new schema_builder_1.SchemaBuilder('test');
        var exception = null;
        try {
            builder.getStore('foo');
        }
        catch (e) {
            exception = e;
        }
        expect(exception).toBeTruthy();
        done();
    });
    it("should only execute .run() blocks in live DB mode", function (done) {
        var builder = new schema_builder_1.SchemaBuilder('test');
        var good = false;
        builder.run(function () {
            expect(true).toBe(false);
        });
        builder.setDatabase({ idb: function () { }, getSchema: function () { return {}; } }, {});
        builder.run(function () {
            good = true;
        });
        builder.disconnectDatabase();
        builder.run(function () {
            expect(true).toBe(false);
        });
        expect(good).toBe(true);
        done();
    });
    it("should inject repos in .run() blocks", function (done) {
        var builder = new schema_builder_1.SchemaBuilder('test');
        var good = false;
        idbMock.reset();
        idbMock.mock.open('dbname', 1).onsuccess = function (ev) {
            var idb = ev.target.result;
            var db = new database_1.Database(builder, idb);
            builder.setDatabase(db, idb.transaction(['foo'], 'readonly'));
            builder.run(function (foo) {
                good = true;
                expect(typeof foo).toBe('object');
            });
            expect(good).toBe(true);
            done();
        };
    });
    it("should create a store builder and allow to request it", function (done) {
        var builder = new schema_builder_1.SchemaBuilder('test');
        var exception = null;
        var storeBuilder = builder.createStore('foo');
        try {
            var builder2 = builder.getStore('foo');
            expect(storeBuilder).toBe(builder2);
        }
        catch (e) {
            exception = e;
        }
        expect(exception).toBeNull();
        done();
    });
    it("should track fields which are built", function (done) {
        var builder = new schema_builder_1.SchemaBuilder('test');
        var exception = null;
        var store = builder.createStore('foo');
        store.field('abc');
        expect(store.store.fields.abc).toBeTruthy();
        store.field('def');
        expect(store.store.fields.def).toBeTruthy();
        // Read it back
        expect(store.getField('def').name).toBe('def');
        expect(store.getField('def').index).toBe('def');
        expect(store.getField('def').unique).toBe(false);
        expect(store.getField('abc').name).toBe('abc');
        expect(store.getField('abc').index).toBe('abc');
        expect(store.getField('abc').unique).toBe(false);
        done();
    });
});
