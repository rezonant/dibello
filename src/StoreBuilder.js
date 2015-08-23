/**
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti
 */

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
function StoreBuilder(builder, name, id) {
	this.builder = builder;
	this.store = {
		primaryKey: id,
		name: name,
		fields: {},
	};
	
	if (builder) {
		this.builder.stores[name] = this;
		if (this.builder.transaction && this.builder.db) {
			  this.store.realized = this.builder.db.createObjectStore(name, { keyPath: id });
		}
		
	}
}; module.exports = StoreBuilder;

/**
 * Run an imperative migration block. The callback will only be executed
 * if the builder is in live (modifying) mode. The transact injector is used
 * to pass the dependencies which the function definition declares.
 * 
 * @param {function} callback The function to call 
 */
StoreBuilder.prototype.run = function(callback) {
	if (this.builder)
		return this.builder.run(callback);
};

/**
 * Get all fields which are declared as foreign.
 * 
 * @returns {Array} An array of the matching fields.
 */
StoreBuilder.prototype.getForeignFields = function() {
	var items = [];
	
	for (var i = 0, max = this.store.fields.length; i < max; ++i) {
		var field = this.store.fields[i];
		
		if (field.references) {
			items.add(field);
		}
	}
	
	return items;
}

/**
 * Get all fields which are declared as oneToMany().
 * 
 * @returns {Array} An array of the matching fields.
 */
StoreBuilder.prototype.getOneToManyFields = function() {
	var items = [];
	
	for (var i = 0, max = this.store.fields.length; i < max; ++i) {
		var field = this.store.fields[i];
		
		if (field.references) {
			items.add(field);
		}
	}
	
	return items;
}
		
/**
 * Create a new object store.
 * 
 * @param {String} name The name of the store to create
 */
StoreBuilder.prototype.createStore = function(name) {
	if (!this.builder) {
		throw {
			type: 'NoBuilderToCreateStoreOn',
			message: 'Cannot start a new store definition without an attached SchemaBuilder (storeBuilder.store())'
		};
	}
	
	return this.builder.createStore(name);
};

/**
 * Retrieve an existing object store
 * 
 * @param {String} name The name of the store to retrieve
 */
StoreBuilder.prototype.getStore = function(name) {
	if (!this.builder) {
		throw {
			type: 'NoBuilderToGetStoreOn',
			message: 'Cannot start a new store definition without an attached SchemaBuilder (storeBuilder.store())'
		};
	}
	
	return this.builder.getStore(name);
};

/**
 * Retrieve an existing field
 * 
 * @param {String} name The name of the field to retrieve
 */
StoreBuilder.prototype.getField = function(name) {
	if (!this.store.fields[name]) {
		throw {
			error: 'NoSuchField',
			message: 'The field '+name+' does not exist'
		};
	}
	
	return this.store.fields[name];
};

/**
 * Add a new key field
 * 
 * @param {String} name The name of the new field
 */
StoreBuilder.prototype.key = function(name) {
	this.addField(name, {key: true, index: name, name: name, unique: false});
	return this;
};

/**
 * Add a new generic field 
 * 
 * @param {String} name The name of the new field
 */
StoreBuilder.prototype.field = function(name) {
	this.addField(name, {key: false, index: name, name: name, unique: false});
	return this;
};

/**
 * Allows for creating any type of field with a single API.
 * 
 * @param {String} name The name of the new field
 * @param {String} data The metadata to save with the field definition
 */
StoreBuilder.prototype.addField = function(name, data) {
	if (this.store.fields[name]) {
		throw {
			error: 'FieldAlreadyExists',
			message: 'The field '+name+' already exists'
		};
	}
	
	this.store.fields[name] = data;
	
	// If we're live, then do it!
	
	if (data.key && this.builder && this.builder.transaction) {
		if (!this.store.realized)
			this.store.realized = this.builder.transaction.objectStore(this.store.name);
		
		this.store.realized.createIndex(data.index, data.name, {unique: data.unique});
	}
	
	return this;
};

/**
 * Remove the given field
 * 
 * @param {String} name The name of the field to remove
 */
StoreBuilder.prototype.remove = function(name) {
	this.removeField(name);
	return this;
}

/**
 * Alias for remove()
 * 
 * @param {String} name The name of the field to remove
 */
StoreBuilder.prototype.removeField = function(name) {
	delete this.store.fields[name];
	
	if (this.builder && this.builder.transaction) {
		if (!this.store.realized)
			this.store.realized = this.builder.transaction.objectStore(this.name);
		this.store.realized.deleteIndex(name);
	}
	
	return this;
}

/**
 * Add the primary key field to this store
 * 
 * @param {String} name The name of the new field
 */
StoreBuilder.prototype.id = function(name) {
	this.addField(name, {key: true, index: name, name: name, unique: true});
	return this;
};

/**
 * Adds a foreign key field to this store. This entity controls the relationship.
 * The inverse of this relation is oneToMany().
 * 
 * @param {String} name The name of the new field
 * @param {String} ref The field which this foreign field references (ie apples.id)
 */
StoreBuilder.prototype.foreign = function(name, ref) {
	this.addField(name, {
		key: true, 
		index: name, 
		name: name, 
		unique: false, 
		references: ref,
		referenceType: 'foreign'
	});
	
	return this;
};

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
StoreBuilder.prototype.oneToMany = function(name, ref) {
	this.addField(name, {
		key: true, 
		index: name, 
		name: name, 
		unique: false, 
		references: ref,
		referenceType: 'oneToMany'
	});
	return this;
};

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
StoreBuilder.prototype.manyToMany = function(name, ref) {
	this.addField(name, {
		key: true, 
		index: name, 
		name: name, 
		unique: false, 
		references: ref,
		referenceType: 'manyToMany'
	});
	return this;
};

/**
 * Adds a unique key field to this store
 * @param {String} name The name of the new field
 */
StoreBuilder.prototype.unique = function(name) {
	this.addField(name, {key: true, index: name, name: name, unique: true});
	return this;
};
