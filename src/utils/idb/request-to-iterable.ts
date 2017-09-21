import "core-js/fn/symbol/async-iterator";

/**
 * Converts an IndexedDB IDBCursor into an async iterable.
 */
export function idbRequestToIterable<T>(request : IDBRequest | Promise<IDBRequest>, map? : (any) => T): AsyncIterable<T> {

	let requestPromise : Promise<IDBRequest>;

	if (!request['then'])
		requestPromise = Promise.resolve(request);
	else 
		requestPromise = <Promise<IDBRequest>>request;
	
	let cancelled = false;
	let finished = false;
	let cursor : IDBCursor = null;
	let bufferedResults : Promise<IteratorResult<T>>[] = [];
	let resolve, reject;

	bufferedResults.push(new Promise((rs, rj) => {
		resolve = rs;
		reject = rj;
	}));
	
	requestPromise.then(request => {
		request.onsuccess = function(ev) {

			if (!ev.target)
				return;
			
			cursor = (<any>ev.target).result;
	
			// End the generator if we're done
	
			if (!cursor) {
				finished = true;
				resolve(<IteratorResult<T>>{
					done: true
				});
				return;
			}
	
			let value = (<any>cursor).value;
			
			resolve(<IteratorResult<T>>{
				value: map? map(value) : value,
				done: false
			});
			
			if (cancelled) {
				return;
			}
	
			bufferedResults.push(new Promise<IteratorResult<T>>((rs, rj) => {
				resolve = rs;
				reject = rj;
			}));
	
			cursor.continue();
		};
	
		request.onerror = function(ev) {
			reject(ev);
		};	
	})

	return {
		[Symbol.asyncIterator](): AsyncIterator<T> {
			return {
				next(): Promise<IteratorResult<T>> {
					return bufferedResults.shift();
				},

				return(): Promise<IteratorResult<T>> {
					cancelled = true;
					return bufferedResults.shift();
				},

				throw(): Promise<IteratorResult<T>> {
					return null;
				}
			};
		}
	};
}; 
