/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 * Common implementation of transact()
 * 
 */

var annotateFn = require('./utils/annotateFn.js');
var injector = require('./utils/lightinjector.js');
var Repository = require('./Repository.js');

function SkateUnknownStoreException(message) {
	this.message = message;
};

/**
 * Calls a function, injecting the proper repositories and related services (db, transaction),
 * for the given transaction (or the transaction created by a factory function).
 * If no transaction is passed, one is automatically created based on the repositories requested
 * by the given function.
 * 
 * @param {type} fn
 * @param {type} mode
 * @returns {undefined}
 */
function transact(db, transactionOrFactory, repositoryFactory, fn, mode) {
	var mode = mode || 'readonly';
	
	if (!repositoryFactory) {
		repositoryFactory = function(db, name, tx) {
			return new Repository(db, name, tx);
		};
	}
	
	// Use LightInjector to inject the parameters dynamically.
	// We'll use this to map in the database, a transaction,
	// and repositories for any specifically named object stores.
	
	injector({
		db: db,
		
		/**
		 * Traverse through the parameters given and decorate the map
		 * such that any needed repositories are available when the injector
		 * later maps parameters to injection assets.
		 * 
		 * @param {Array} params
		 * @returns
		 */
		$populate: function(params) {
			var storeNames = [];
			for (var i = 0, max = params.length; i < max; ++i) {
				if (params[i] == 'db')
					continue;

				storeNames.push(params[i]);
			}

			if (transactionOrFactory == null) {
				this.transaction = db.transaction(storeNames, mode);
			} else if (typeof transactionOrFactory === 'function') {
				this.transaction = transactionOrFactory(storeNames, mode);
			} else {
				this.transaction = transactionOrFactory;
			}
			
			var hydratedParams = [];
			for (var i = 0, max = params.length; i < max; ++i) {
				var param = params[i];
				
				// Skip predefined stuff
				if (this[param])
					continue;
				
				var storeOnly = false;
				var storeName = param;
				
				if (storeName.indexOf('store:') == 0) {
					storeOnly = true;
					storeName = storeName.replace(/^store:/, '');
				}
				
				var store;
				try {
					store = this.transaction.objectStore(storeName);
				} catch (e) {
					throw new SkateUnknownStoreException('No such object store '+param);
				}
				
				if (storeOnly) {
					this[param] = store;
				} else {
					this[param] = repositoryFactory(db, param, this.transaction);
				}
			}
		}
	}, null, fn);
};

module.exports = transact;