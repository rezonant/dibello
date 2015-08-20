/**
 * Module providing the SchemaBuilder class.
 * 
 * @module skate/SchemaBuilder 
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti 
 */

var transact = require('./transact.js');
var StoreBuilder = require('./StoreBuilder.js');

/**
 * @class
 * @param {String} name The name of the IndexedDB database being defined
 * @param {object} registry An object with a prepareRepository() method, or NULL
 * @returns {SchemaBuilder}
 */
function SchemaBuilder(name, registry) {
	this.name = name;
	this.stores = {};
	this.registry = registry;
}; module.exports = SchemaBuilder;

/**
 * Pass in a version change transaction so that we can modify the schema.
 * Without it, no run blocks are run and no changes made to the schema are 
 * applied (they are only modeled for analysis later).
 */
SchemaBuilder.prototype.setDatabase = function(db, transaction) {
	
	this.db = db;
	this.transaction = transaction;
};

SchemaBuilder.prototype.isLive = function() {
	return this.transaction && this.db;
};

/**
 * Disable modifications of the schema via an existing version change transaction (if any).
 */
SchemaBuilder.prototype.disconnectDatabase = function() {
	this.transaction = null;
	this.db = null;
};

// SchemaBuilder

/**
 * Create a new store
 * 
 * @param {String} name
 * @returns {StoreBuilder}
 */
SchemaBuilder.prototype.createStore = function(name) {
	if (this.stores[name]) {
		throw 'store-already-exists: A store with name \''+name+'\' already exists.';
	}
	return new StoreBuilder(this, name);
};

/**
 * Get an existing store so that you can modify it.
 * 
 * @param {String} name
 * @returns {StoreBuilder} 
 */
SchemaBuilder.prototype.getStore = function(name) {
	if (!this.stores[name]) {
		throw 'no-such-store: A store with name \''+name+'\' could not be found.';
	}
	
	return this.stores[name];
};

/**
 * Migrate data imperatively. Only calls back if a migration is in progress.
 * 
 * @param {function} callback
 * @returns {SchemaBuilder}
 */
SchemaBuilder.prototype.run = function(callback) {
	if (this.transaction && this.db) {
		var metadata = annotateFn(callback);
		var fn = metadata.fn;
		var params = metadata.params;
		var self = this;
		
		transact(this.db, this.transaction, function(db, name, tx) {
			var repo = new Repository(db, name, tx);
			registry.prepareRepository(repo);
			return repo;
		}, fn, 'readwrite');
	}
	return this;
};

/**
 * Output the current schema to the console for debugging.
 */
SchemaBuilder.prototype.debug = function() {
	console.log('Schema for database '+this.name);
	
	for (var name in this.stores) {
		var store = this.stores[name];
		console.log('store '+name);
		console.log('- pkey: '+store.store.primaryKey);
		
		for (var fieldName in store.store.fields) {
			var field = store.store.fields[fieldName];
			console.log(' - '+fieldName);
		}
	}
	
};
