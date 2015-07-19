
var transact = require('../transact.js');

/**
 * Lose the boilerplate clutter in your IndexedDB transactions using Skate's 
 * injection-driven transaction API.
 * 
 * Simply call transact, passing a function with parameters that specify what 
 * repositories are desired, and optionally an IndexedDB transaction mode ('readonly', 'readwrite')
 * 
 * Some additional non-object-store parameters may be used: 'db' (the IDBDatabase instance), 'transaction' (the IDBTransaction instance)
 * The transaction will be created specifying ONLY the object stores you requested, so attempting
 * to get additional object stores later will not work.
 * 
 * For that you must start a new transaction, which you can do with db.transact() from within the
 * callback.
 * 
 * @param {type} fn
 * @param {type} mode
 * @returns {undefined}
 */
window.IDBDatabase.prototype.transact = function(fn, mode) {
	return transact(this, null, fn, mode);
};