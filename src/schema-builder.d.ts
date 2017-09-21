import { StoreBuilder } from '@dibello/store-builder';
import { Database } from '@dibello/database';
/**
 * @class
 * @alias module:dibello.SchemaBuilder
 * @param {String} name The name of the IndexedDB database being defined
 * @param {object} registry An object with a prepareRepository() method, or NULL
 */
export declare class SchemaBuilder {
    constructor(name: any, registry?: any);
    name: string;
    stores: {
        [name: string]: any;
    };
    registry: any;
    db: Database;
    transaction: IDBTransaction;
    /**
     * Pass in a version change transaction so that we can modify the schema.
     * Without it, no run blocks are run and no changes made to the schema are
     * applied (they are only modeled for analysis later).
     */
    setDatabase(db: any, transaction: any): void;
    isLive(): Database;
    /**
     * Disable modifications of the schema via an existing version change transaction (if any).
     */
    disconnectDatabase(): void;
    /**
     * Create a new store
     *
     * @param {String} name
     * @returns {module:dibello.StoreBuilder}
     */
    createStore(name: any): StoreBuilder;
    /**
     * Get an existing store so that you can modify it.
     *
     * @param {String} name
     * @returns {module:dibello.StoreBuilder}
     */
    getStore(name: any): any;
    /**
     * Migrate data imperatively. Only calls back if a migration is in progress.
     *
     * @param {function} callback
     * @returns {module:dibello.SchemaBuilder}
     */
    run(callback: any): this;
    /**
     * Output the current schema to the console for debugging.
     */
    debug(): void;
}
