/**
 * Module providing Dibello's Database class which wraps an IndexedDB database to provide
 * access to Dibello's features as well as the underlying IndexedDB features.
 * 
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti
 */
var transact = require('./transact.js');
var Repository = require('./Repository.js');

/**
 * Constructs a Database object which represents an IndexedDB database.
 * 
 * @class
 * @alias module:dibello.Database
 * @param {module:dibello.SchemaBuilder} schema A representation of the database's intended schema
 * @param {IDBDatabase} idb An opened IndexedDB database
 * 
 */
function Database(schema, idb) {
	if (!schema)
		throw "Must pass a SchemaBuilder as 'schema' to the dibello.Database constructor";
	this._schema = schema;
	this._idb = idb;
	this._repositoryConfigs = {};  
	this._transact = transact;
}; module.exports = Database;



/**
 * Start a transaction.
 * @returns {Promise} A promise to resolve once the transaction has completed processing.
 */
Database.prototype.transact = function(mode, fn) {
	
	if (typeof mode !== 'string') {
		throw 'First parameter must be a mode string';
	}
	
	var self = this;
	return transact(this, null, function(db, name, transaction) {
		return self.repository(name, transaction);
	}, fn, mode);
};

/**
 * Set the IDBDatabase instance held by this Database instance
 * @param {IDBDatabase} idb The {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} instance
 */
Database.prototype.setIDB = function(idb) {
	this._idb = idb;
};

/**
 * Retrieve a repository
 * 
 * @param {String} name The name of the repository to retrieve
 * @param {type} tx An optional transaction which the repository should be associated with
 * @returns {module:dibello.Repository} The new repository object
 */
Database.prototype.repository = function(name, tx) {
	var repo = new Repository(this.idb(), name, tx);
	this.prepareRepository(repo);
	return repo;
};

/**
 * Prepare the given Repository instance by calling any config functions
 * registered for its name.
 * 
 * @param {module:dibello.Repository} repository The repository which must be prepared
 */
Database.prototype.prepareRepository = function(repository) {
	if (this._repositoryConfigs[repository.storeName])
		this._repositoryConfigs[repository.storeName](repository);
};

/**
 * Registers a configuration function. Whenever a repository of this 
 * type needs to be made, the given function will be called. 
 * It is possible to have multiple configurers, but should be avoided 
 * for simplicity.
 * 
 * @param {String} name The name of the repository to configure
 * @param {function} cb A callback which will be called for each 
 *		instance of the desired repository which is created
 */
Database.prototype.configRepository = function(name, cb) {
	if (this._repositoryConfigs[name]) {
		var original = this._repositoryConfigs[name];
		this._repositoryConfigs[name] = function(repo) {
			original(repo);
			cb(repo);
		}; 
	} else {
		this._repositoryConfigs[name] = cb;
	}
};

/**
 * Get the schema of this database, as determined by the migrations which initialized 
 * it. This is mostly for use internally but can be useful for debugging (see 
 * SchemaBuilder.debug()).
 * 
 * @returns {module:dibello.SchemaBuilder} The SchemaBuilder containing this database's current schema
 */
Database.prototype.getSchema = function() {
	return this._schema;
}

/**
 * Retrieve the underlying {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} instance 
 * @returns {IDBDatabase} The {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} instance
 */
Database.prototype.idb = function() {
	return this._idb;
};

