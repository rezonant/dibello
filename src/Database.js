var transact = require('./transact.js');

function Database(schema, idb) {
	this._schema = schema;
	this._idb = idb;
	this._repositoryConfigs = {};
}; module.exports = Database;

/**
 * Start a transaction.
 * @returns {unresolved}
 */
Database.prototype.transact = function(mode, fn) {
	var self = this;
	return transact(this.idb(), null, function(db, name, transaction) {
		return self.repository(name, transaction);
	}, fn, mode);
};

/**
 * Retrieve a repository
 * 
 * @param {type} name
 * @param {type} tx
 * @returns {sqlite3.Database.prototype.repository.repo|Repository}
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
 * @param {type} repository
 * @returns {undefined}
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
 * @param {type} name
 * @param {type} cb
 * @returns {undefined}
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
 * @returns {unresolved}
 */
Database.prototype.getSchema = function() {
	return this._schema;
}

/**
 * Retrieve the underlying IDBDatabase instance 
 * @returns {unresolved}
 */
Database.prototype.idb = function() {
	return this._idb;
};

