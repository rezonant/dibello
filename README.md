# Skate

Provides a high-level API on top of IndexedDB.

### Installation

Node (server-side) and Browserify (client-side): 
```sh
npm install skate 
```
 
Regardless of whether you are in Node or Browserify, you can use 
```require('skate')``` to obtain the Skate API.

Bower (client-side): 
```sh
bower install skate
```

Now include ```bower_components/skate/dist/skate.min.js``` either directly on your page or within your 
Javascript build step.

Non-minified dist versions are also included.

### Opening a Database

First, you should open a connection to an IndexedDB database using Skate.
You must pass the indexedDB API since Skate can be used with many different IDB
implementations (not just the native browser one). Along with the database name,
you must also pass an options object which specifies the current schema version
of the database, and a set of migrations which are run to compute the schema of the
database. More about migrations later.


```js
var skate = require('skate');
skate.open(indexedDB, 'mydb', {
   version: 2
   migrations: {
      "1": function(schema) {
	    schema.createStore('apples')
	        .id('id'),
	        .key('color')
	        .field('history');
      },
      "2": function(schema) {
        schema.getStore('apples')
            .key('size');
      }
   }
}).then(function(db) {
    // hey, we have an indexeddb database (IDBDatabase)
});

```

### Transactions

Once you have a database instance, you can transact.
```js
skate.transact(db, 'readonly', function(db, transaction, apples) {
    // db and transaction are IDBDatabase and IDBTransaction, respectfully.
    // apples is a SkateRepository around the 'apples' IDB object store
    
    apples.get('someappleid').then(function(item) {
        console.log('found my apple: '+item.name);
    });
});
```

The transact function uses an injector mechanism similar to that of Angular and 
other dependency injection frameworks. You can specify service parameters in 
any order, and when transact() creates the IndexedDB transaction, it will 
authorize only the stores of the repositories you have requested. That is to say,
if you request:
```js
skate.transact(db, 'readwrite', function(apples, oranges) {});
```
Then skate.transact() will call the IndexedDB method
```js
db.transaction(['apples', 'oranges'], 'readwrite');
```
...in order to construct the transaction. The repositories passed for 'apples' 
and 'oranges' will be assocaited with this transaction.

### Migrations
Note that during a migration, migrations are run from the very first up to the
outstanding ones. This is to allow the SchemaBuilder to generate a complete and
correct view of the schema.

Within migration functions, you can only interact with and modify the database schema.
If you need to make actual changes to the data, you must use a .run() block.
run() blocks are injected just like skate.transact() calls, meaning you can
request any repositories, stores, or just the db and/or transaction instances.

```js
"1": function(schema) {
    schema.run(function(db, transaction, apples) {
        apples.all().emit(function(apple) {
            // perhaps modify 'apple' in some way 
            apples.persist(apple);
        });
    })
}

### Testing
To test this package using Karma run:
```npm test```

### Authors
- William Lahti <<wilahti@gmail.com>>

### License
This software is provided under the terms of the MIT License. See COPYING for details.