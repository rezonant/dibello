/**
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti
 */
import { SchemaBuilder } from './schema-builder';
/**
 * Represents a data store being built (or reflected upon)
 *
 * @class
 * @alias module:dibello.StoreBuilder
 * @param {module:dibello.SchemaBuilder} builder The SchemaBuilder instance which owns this StoreBuilder
 * @param {String} name The name of the object store being built
 * @param {String} id The name of the field which will represent the object store's primary key
 * @returns {module:dibello.StoreBuilder} Allows for describing (and optionally applying chanages to) the schema of
 *			an IndexedDB object store.
 */
export declare class StoreBuilder {
    private builder;
    private name;
    constructor(builder: SchemaBuilder, name: string, id: string);
    store: any;
    /**
     * Run an imperative migration block. The callback will only be executed
     * if the builder is in live (modifying) mode. The transact injector is used
     * to pass the dependencies which the function definition declares.
     *
     * @param {function} callback The function to call
     */
    run: (callback: any) => any;
    /**
     * Get all fields which are declared as foreign.
     *
     * @returns {Array} An array of the matching fields.
     */
    getForeignFields: () => any[];
    /**
     * Get all fields which are declared as oneToMany().
     *
     * @returns {Array} An array of the matching fields.
     */
    getOneToManyFields(): any[];
    /**
     * Create a new object store.
     *
     * @param {String} name The name of the store to create
     */
    createStore(name: any): StoreBuilder;
    /**
     * Retrieve an existing object store
     *
     * @param {String} name The name of the store to retrieve
     */
    getStore(name: any): any;
    /**
     * Retrieve an existing field
     *
     * @param {String} name The name of the field to retrieve
     */
    getField(name: any): any;
    /**
     * Add a new key field
     *
     * @param {String} name The name of the new field
     */
    key(name: any): this;
    /**
     * Add a new generic field
     *
     * @param {String} name The name of the new field
     */
    field(name: any): this;
    /**
     * Allows for creating any type of field with a single API.
     *
     * @param {String} name The name of the new field
     * @param {String} data The metadata to save with the field definition
     */
    addField(name: any, data: any): this;
    /**
     * Remove the given field
     *
     * @param {String} name The name of the field to remove
     */
    remove(name: any): this;
    /**
     * Alias for remove()
     *
     * @param {String} name The name of the field to remove
     */
    removeField(name: any): this;
    /**
     * Add the primary key field to this store
     *
     * @param {String} name The name of the new field
     */
    id(name: any): this;
    /**
     * Adds a foreign key field to this store. This entity controls the relationship.
     * The inverse of this relation is oneToMany().
     *
     * @param {String} name The name of the new field
     * @param {String} ref The field which this foreign field references (ie apples.id)
     */
    foreign(name: any, ref: any): this;
    /**
     * Adds a oneToMany field to this store. The association is maintained by the foreign
     * entity, and is thus owned there. This is the inverse of a foreign() assocation.
     *
     * ```js
     *     groupsStore.oneToMany(
     *			'users',			// The local field
    *			'users.groupID',	// The field on the foreign object store to link to
    *	   )
    * ```
    * @param {String} name The name of the new field
    * @param {String} ref The field which this field references (ie apples.id)
    */
    oneToMany(name: any, ref: any): this;
    /**
     * Adds a manyToMany field to this store.
     * It is many-to-many in the sense that there may be many
     * hosting entities which reference many foreign entities.
     *
     * No linking table is used here, instead the declaring
     * object holds an array of the items.
     *
     * Thus there is no inverse field to be placed on the foreign entity, because querying for items
     * which reference the other end of the association would be an unavoidable O(N) operation.
     * Instead, if you need easy two-way queryability, use an explicit linking object store with
     * foreign() fields on the linking object, so that it is easy to look up associations in both
     * directions. You can then use regular oneToMany associations on each of the linked entities
     * to provide traversability from either side.
     *
     * ```js
     *     groupsStore.manyToMany(
     *			'users',			// The local field being described, will store as users_ids
    *			'users.id'			// The foreign object store and the key which should be used
    *	   )
    * ```
    * @param {String} name The name of the new field
    * @param {String} ref The field which this field references (ie apples.id)
    */
    manyToMany(name: any, ref: any): this;
    /**
     * Adds a unique key field to this store
     * @param {String} name The name of the new field
     */
    unique(name: any): this;
}
