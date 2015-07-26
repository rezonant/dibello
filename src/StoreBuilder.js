/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 */

function StoreBuilder(builder, name, id) {
	this.builder = builder;
	this.store = {
		primaryKey: id,
		name: name,
		fields: [],
	};
	
	if (builder) {
		this.builder.stores[name] = this;
		if (this.builder.transaction && this.builder.db) {
			  this.store.realized = this.builder.db.createObjectStore(name, { keyPath: id });
		}
		
	}
}; module.exports = StoreBuilder;

StoreBuilder.prototype.run = function(callback) {
	if (this.builder)
		return this.builder.run(callback);
};

StoreBuilder.prototype.createStore = function(name) {
	if (!this.builder) {
		throw {
			type: 'NoBuilderToCreateStoreOn',
			message: 'Cannot start a new store definition without an attached SchemaBuilder (storeBuilder.store())'
		};
	}
	
	return this.builder.createStore(name);
};

StoreBuilder.prototype.getStore = function(name) {
	if (!this.builder) {
		throw {
			type: 'NoBuilderToGetStoreOn',
			message: 'Cannot start a new store definition without an attached SchemaBuilder (storeBuilder.store())'
		};
	}
	
	return this.builder.getStore(name);
};

StoreBuilder.prototype.getField = function(name) {
	if (!this.store.fields[name]) {
		throw {
			error: 'NoSuchField',
			message: 'The field '+name+' does not exist'
		};
	}
	
	return this.store.fields[name];
};

StoreBuilder.prototype.key = function(name) {
	this.addField(name, {key: true, index: name, name: name, unique: false});
	return this;
};

StoreBuilder.prototype.field = function(name) {
	this.addField(name, {key: false, index: name, name: name, unique: false});
	return this;
};

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

StoreBuilder.prototype.remove = function(name) {
	this.removeField(name);
	return this;
}

StoreBuilder.prototype.removeField = function(name) {
	delete this.store.fields[name];
	
	if (this.builder && this.builder.transaction) {
		if (!this.store.realized)
			this.store.realized = this.builder.transaction.objectStore(this.name);
		this.store.realized.deleteIndex(name);
	}
	
	return this;
}

StoreBuilder.prototype.id = function(name) {
	this.addField(name, {key: true, index: name, name: name, unique: true});
	return this;
};

StoreBuilder.prototype.foreign = function(name, ref) {
	this.addField(name, {key: true, index: name, name: name, unique: false, references: ref});
	return this;
};

StoreBuilder.prototype.unique = function(name) {
	this.addField(name, {key: true, index: name, name: name, unique: true});
	return this;
};
