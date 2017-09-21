/**
 * # dibello/transact
 * 
 * transact() is Dibello's core implementation of IndexedDB transactional injection,
 * which is the process of introspecting a function's parameters, creating a 
 * transaction to suit them, and then calling the function, passing objects to the 
 * function as it requested via naming.
 * 
 * This is function injection in a way popularized by the Angular.js framework.
 * transact() is used internally within Dibello in many places, including Database.transact(),
 * SchemaBuilder.run() and Repository.hydrate().
 * 
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti    
 */   

import { inject } from '@dibello/utils/light-injector';
import { Repository } from '@dibello/repository';

/**
 * Calls a function, injecting the proper repositories and related services (db, transaction),
 * for the given transaction (or the transaction created by a factory function).
 * If no transaction is passed, one is automatically created based on the repositories requested
 * by the given function.
 * 
 * @param {IDBTransaction|function} transactionOrFactory The transaction to use, 
 *		or a function to construct a transaction from an array of object store names and a mode
 *		(ie function(storeNames, mode))
 * @param {function} repositoryFactory A function which creates a repository when given a db, name, and transaction
 *		(ie function(db, name, tx)) or null to use the default factory
 * @param {function} fn The function which should be introspected and run
 * @param {String} mode The transaction mode ('readonly' or 'readwrite')
 * @param {String} extraInjectables An object containing extra services which should be made available for injection
 *		in addition to the standard ones
 * 
 * @returns {Promise} A promise to resolve once the transaction has fully completed.
 */
export function transact(db, transactionOrFactory, repositoryFactory, fn, mode, extraInjectables?) {
	var mode = mode || 'readonly';
	var idb = db.idb();
	
	if (!repositoryFactory) {
		repositoryFactory = function(db, name, tx) {
			return new Repository(db, name, tx);
		};
	}
	
	var injectables = {
		$db: db,
		$$db: db.idb(),
		$schema: db.getSchema(),
		$transact: function() {
			return function(mode, fn) {
				transact(db, transactionOrFactory, repositoryFactory, fn, mode);
			};
		},
		
		/**
		 * Traverse through the parameters given and decorate the map
		 * such that any needed repositories are available when the injector
		 * later maps parameters to injection assets.
		 * 
		 * @param {Array} params
		 */
		$populate$: function(params) {
			var storeNames = [];
			for (var i = 0, max = params.length; i < max; ++i) {
				if (params[i] == 'db')
					continue;

				storeNames.push(params[i]);
			}

			if (transactionOrFactory == null) {
				this.$transaction = idb.transaction(storeNames, mode);
			} else if (typeof transactionOrFactory === 'function') {
				this.$transaction = transactionOrFactory(storeNames, mode);
			} else {
				this.$transaction = transactionOrFactory;
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
					// @deprecated, will be removed at 1.0.0
					storeOnly = true;
					storeName = storeName.replace(/^store:/, '');
				} else if (storeName.indexOf('$$') == 0) {
					storeOnly = true;
					storeName = storeName.replace(/^\$\$/, '');
				}
				
				var store;
				try {
					store = this.$transaction.objectStore(storeName);
				} catch (e) {
					throw 'No such object store \''+param+'\'';
				}
				
				if (storeOnly) {
					this[param] = store;
				} else {
					this[param] = repositoryFactory(db, param, this.$transaction);
				}
			}
		}
	};
	
	if (extraInjectables) {
		for (var name in extraInjectables) {
			if (injectables[name])
				continue;
			injectables[name] = extraInjectables[name];
		}
	}
	
	// Use LightInjector to inject the parameters dynamically.
	// We'll use this to map in the database, a transaction,
	// and repositories for any specifically named object stores.
	
	return inject(injectables, null, fn);
}