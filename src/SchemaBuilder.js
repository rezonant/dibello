/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 * SchemaBuilder class
 * 
 */

var transact = require('./transact.js');
var StoreBuilder = require('./StoreBuilder.js');

function SchemaBuilder() {
	this.stores = [];
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
 * @param {type} name
 * @returns {StoreBuilder}
 */
SchemaBuilder.prototype.createStore = function(name) {
	if (this.stores[name]) {
		throw {
			error: 'StoreAlreadyExists',
			message: 'A store with name \''+name+'\' already exists.'
		};
	}
	return new StoreBuilder(this, name);
};

/**
 * Get an existing store so that you can modify it.
 * 
 * @param {type} name
 * @returns {Array}
 */
SchemaBuilder.prototype.getStore = function(name) {
	if (!this.stores[name]) {
		throw {
			error: 'NoSuchStore',
			message: 'A store with name \''+name+'\' could not be found.'
		};
	}
	
	return this.stores[name];
};

/**
 * Migrate data imperatively. Only calls back if a migration is in progress.
 * 
 * @param {type} callback
 * @returns {SchemaBuilder.prototype}
 */
SchemaBuilder.prototype.run = function(callback) {
	if (this.transaction && this.db) {
		var metadata = annotateFn(callback);
		var fn = metadata.fn;
		var params = metadata.params;
		var self = this;
		
		transact(this.db, this.transaction, fn, 'readwrite');
	}
	return this;
};
