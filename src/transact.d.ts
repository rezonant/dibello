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
export declare function transact(db: any, transactionOrFactory: any, repositoryFactory: any, fn: any, mode: any, extraInjectables?: any): any;
