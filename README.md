# Dibello

Provides an ORM library built on top of IndexedDB.

Dibello is a high-level ORM framework on top of 
HTML5 IndexedDB. It can be used to dramatically simplify code which 
uses IndexedDB to persist and query for Javascript objects within the 
browser's local storage. 

### What is this?
- A powerful migration management system which doubles as a 
  description of the object schema for powering Dibello's ORM features
- A DI-based mechanism for expressing IndexedDB transactions
  which dramatically simplifies building IDB applications.
- A rich repository layer that builds upon the capabilities of
  IndexedDB object stores by providing more advanced query methods 
  and a unified, terse way to interact with IndexedDB requests
- Written in Typescript, usable in ES5 environments and up.

### Looking for the old Dibello?

Switch to the `0.x` branch, where the classic non-Typescript ES5 version of Dibello still lives.

### License

This software is provided under the terms of the MIT License. See LICENSE for details.

### Installation

```sh
npm install dibello --save
```

### Opening a Database

First, you should open a connection to an IndexedDB database using Dibello.
You must pass the indexedDB API since Dibello can be used with many different IDB
implementations (not just the native browser one). Along with the database name,
you must also pass an options object which specifies the current schema version
of the database, and a set of migrations which are run to compute the schema of the
database. More about migrations later.


```ts
import { Database } from 'dibello';
let db = await Database.open(indexedDB, 'mydb', {
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
});

// if we need to do low-level stuff, we can 
// get the IDBDatabase with .idb()
var idb = db.idb();

// but there are better ways to 
// use a dibello.Database...
```

### Transactions

Once you have a database instance, you can transact.
```js
db.transact('readonly', async function(apples) {

    // apples is a Repository which wraps the 'apples' IDBObjectStore,
	// and repositories use promises :-)

    let item = await apples.get('someappleid');
    console.log(`found my apple: ${item.name}`);
});
```

The transact function uses an injector mechanism similar to that of Angular and 
other dependency injection frameworks. You can specify service parameters in 
any order, and transact() will provide the correct services to those parameters.

If you haven't used IndexedDB yet, you might wonder why this introduction starts
with transactions. Traditional IndexedDB requires the use of transactions for any
task which interacts with stored data. From the Mozilla Developer Network:

> IndexedDB is built on a transactional database model. Everything you do in 
> IndexedDB always happens in the context of a transaction. The IndexedDB 
> API provides lots of objects that represent indexes, tables, cursors, 
> and so on, but each of these is tied to a particular transaction. 
> Thus, you cannot execute commands or open cursors outside of a transaction. 
> Transactions have a well-defined lifetime, so attempting to use a transaction 
> after it has completed throws exceptions. Also, transactions auto-commit 
> and cannot be committed manually.

We like transactions, but the API for using them is very verbose.
Code for getting all phone numbers for a user might
look like the following in vanilla IndexedDB:

```js
// No Dibello here, just plain old IndexedDB
function getPhonesForUser(db, username) {
	return new Promise(function(resolve, reject) {
		function handleError(message) {
			return function(event) {
				console.log('Encountered an error while '+message);
				reject(event);
			}
		}

		var tx = db.transaction(['users', 'phoneNumbers'], 'readonly');
		var users = tx.objectStore('users');
		var phones = tx.objectStore('phones');

		var foundNumbers = [];
		var request = users.index('username').openCursor(username);

		request.onerror = handleError('retrieving user');
		request.onsuccess = function(event) {
			var item = event.target.result;
			var request = phones.index('userID').openCursor(user.id);
			request.onsuccess = function(event) {
				var cursor = event.target.cursor;
				if (!cursor) {
					resolve(foundNumbers);
					return;
				}

				var phoneNumberRecord = cursor.value;
				foundNumbers.push(phoneNumberRecord);

				cursor.continue();
			};

		};
	});
}
```

If you read that and didn't have the urge to convert it to use ES6 Promises and async functions, then you probably don't know about them 
yet. Though this function is simple and doesn't benefit much from their use, promises can help prevent deeply nested
code and allow you to work with asynchronous operations much more smoothly. But in the case of vanilla IndexedDB, 
promises don't reduce the lines of code...

```js
async function getPhonesForUser(db, username) {
	let user = await new Promise(function(resolveMain, rejectMain) {
		function handleError(message) {
			return function(event) {
				console.log('Encountered an error while '+message);
				rejectMain(event);
			}
		}

		var tx = db.transaction(['users', 'phoneNumbers'], 'readonly');
		var users = tx.objectStore('users');
		var phones = tx.objectStore('phones');

		new Promise(function(resolve, reject) {
			var request = users.index('username').openCursor(username);

			request.onerror = handleError('retrieving user');
			request.onsuccess = function(event) {
				var item = event.target.result;
				resolve(item);
			};
		});
		return new Promise(function(resolve, reject) {
			var foundNumbers = [];

			var request = phones.index('userID').openCursor(user.id);
			request.onsuccess = function(event) {
				var cursor = event.target.cursor;
				if (!cursor) {
					resolve(foundNumbers);
					return;
				}

				var phoneNumberRecord = cursor.value;
				foundNumbers.push(phoneNumberRecord);

				cursor.continue();
			};
		});
	});
}
```

You would be crazy to use vanilla IndexedDB without some kind of layer above it.
Let's see the same code using Dibello instead:

```js
function getPhonesForUser(dibelloDb, username) {
	return dibelloDb.transact(async function(users, phones) {
		let user = await users.get(username);
		return phones.find({userID: user.id});
	});
}
```

When in doubt, use a transaction, but for simple, single-repository 
operations, you can use detached repositories which acquire a 
transaction as needed:

```ts
function getUser(dibelloDb, username) {
	return dibelloDb.repository('users').get(username);
}
```

When transact() creates the IndexedDB transaction, it will look at the services you
have requested and authorize only the object stores of the repositories you have requested. That is to say,
if you request:
```js
dibelloDb.transact('readwrite', function(apples, oranges) {});
```
Then the following IndexedDB call is made:
```js
idbDatabase.transaction(['apples', 'oranges'], 'readwrite');
```
...in order to construct the transaction. The repositories passed for 'apples' 
and 'oranges' will be specifically associated with this transaction so you may
use them to interact with it. 

### More injectable services

You may want to inject more than just repositories. You can request the 
`Database` instance using `$db`. You can request the `Transaction` instance 
representing your transaction with `$transaction`:

```ts
dibelloDb.transact(function($db, $transaction, users) {

	doSomethingImportantToDatabase();

	if (badThingsHappened) {
		// Uh oh, this transaction is bad.
		$transaction.abort();

		// Well, we can't use it anymore but we need to do 
		// other things with the database. Let's start an 
		// independent transaction and carry on...
		$db.transact(function(logs) {
			logs.put({
				date: new Date(),
				message: 'Things broke and we had to abort the transaction'
			});
		});
	}
});
```

You might need to access the native IndexedDB objects which underpin the `Database` and
`Transaction` (`IDBDatabase` and `IDBTransaction`, respectively).
`transact()` provides these using the `$$db` and `$$transaction` services

```js
dibelloDb.transact(function($$db, $$transaction) {
	var fruit = $$transaction.objectStore('fruit');
	fruit.put({ variant: 'apple' });

	var tx = $$db.transaction(['pies', 'cakes'], 'readonly');
	var pies = tx.objectStore('pies');
	// ....
});
```

You might even want to retrieve just the IDBObjectStore object
instead of a dibello.Repository:

```js
dibelloDb.transact(function($$apples) {
	$$apples.get(9001).onsuccess = function(event) {
		// well, you get the picture
	};
});
```

### Migrations

IndexedDB has the concept of migrations built in. All IndexedDB databases have a 
current version number, and when the application requests to open the database and 
the requested version is higher than the current version, IndexedDB will emit an
upgrade event.

Many IndexedDB libraries provide a layer above this which allows you to specify your 
schema in steps as it progresses through time. Dibello is no different. Let's return to 
our first code example:

```js
import { Database } from 'dibello';
Database.open(indexedDB, 'mydb', {
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
	// ok we're ready!
});

```

Note that during a migration, migration functions are run from the very first up to 
the outstanding ones. All migration functions are run regardless of whether that particular
migration needs to be applied to the database the application is running on. This is to 
allow the SchemaBuilder to generate a complete and correct view of the schema based on your 
migrations. Dibello simply puts the migration engine in "neutral" while running migration 
functions which represent schema changes already present in the database.

This is why within migration functions you can only interact with and modify 
the database schema, *not* the actual data. To do that you must use a 
.run() block. Parameters for run() blocks are dynamically injected just like 
dibello.transact() calls, meaning you can request any of the services described above.

```js
"1": function(schema) {
    schema.run(function(db, transaction, apples) {
        apples.all().emit(function(apple) {
            // perhaps modify 'apple' in some way 
            apples.persist(apple);
        });
    })
}
```

### Getting results as they arrive

When you request more than one object using Dibello, you will receive an `AsyncIteratorIterable` object. If you are in an environment supporting `for...await...of` (such as Typescript 2.3+ with `downlevelIterators: true`, and `es2015`, `esnest.iterables` in your `lib` setting) then you can consume these results elegantly:

```ts
for await (let apple of applesRepo.all()) {
    eatApple();
}
burp();
```

You can still use these if you cannot use async iterables. If you happen to have `async/await` support:

```js
let result = applesRepo.all();
for (let item = await result.next(); !item.done; item = await result.next()) {
    eatApple(apple);
}
burp();
```

If you don't even have async support, the correct code would be pretty verbose, so dibello provides a utility to make it simpler:

```js 
import { iteratorForEach } from 'dibello';
// ...
iteratorForEach(applesRepo.all(), result => {
    if (result.done) {
        burp();
        return;
    }
    
    eatApple(apple);
});
```

All of the above iteration methods stream the results as they arrive, so their memory efficiency is O(1). This is ideal for larger data sets. If you have a smaller data set and you just want an array of the items, you can use `iteratorCollect`. This is useful regardless of the ES environment you are using:

```js 
import { iteratorCollect } from 'dibello';
// ...
iteratorCollect(applesRepo.all(), items => {
    for (let item of items)
        eatApple(apple);
    burp();
});
```

For the remainder of this introduction, we'll use `for...await...of`, but you can substitute these other iteration means in any of the examples.

### Repositories

Most importantly, Dibello's repositories provide a much more terse pattern of interaction with IndexedDB object stores than the vanilla APIs:

```ts
for await (let apple of apples.index('size').cursor().above(5)) {
	recognizeBigness(apple);
});
```

You also have access to more sophisticated query mechanisms:

```ts
let apple = await apples.find({
	color: 'green',
	size: 5
});
eatSizeFiveGreenApple(apple);
```

And .find() isn't just for exact matches:

```js
let apple = await apples.find(function(is) {
	return {
		color: 'green',
		size: is.greaterThan(5)
	}
});
```

Did you see this coming? .find() is also injectable,
and you can use other queries without waiting for them
to finish first:

```ts
let apple = await apples.find(function(is, orchards) {
	return {
		orchard: is.in(orchards.find({
			city: 'Los Angeles'
		}))
	};
});
```

We're excited to see what you can make using Dibello. So `npm install`
and get started! 

### Contributing

Fork us on [Github](http://github.com/rezonant/dibello). Please use 
the Github workflow (ie use feature-specific branches and send 
pull requests). Please only send PRs to the master branch unless 
absolutely necessary.

### Testing

To test this package using Karma run:

```npm test```

### Authors

- William Lahti <<wilahti@gmail.com>>

