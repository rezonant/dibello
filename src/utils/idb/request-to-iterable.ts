import "core-js/fn/symbol/async-iterator";

/**
 * Converts an IndexedDB IDBCursor into an async iterable.
 */
export function idbRequestToIterable<T>(request : IDBRequest | Promise<IDBRequest>, map? : (any) => T | Promise<T>): AsyncIterable<T> {

	let requestPromise : Promise<IDBRequest>;

	if (!request['then'])
		requestPromise = Promise.resolve(request);
	else 
		requestPromise = <Promise<IDBRequest>>request;
	
	let cancelled = false;
	let finished = false;
	let bufferedResults : Promise<IteratorResult<T>>[] = [];
	let resolve, reject; 

	bufferedResults.push(new Promise((rs, rj) => {
		resolve = rs;
		reject = rj;
	}));
	
	requestPromise.then(request => {
		request.onsuccess = async function(ev) {
			if (!ev.target)
				return;
			
			let cursor : IDBCursor = (<any>ev.target).result;
	
			// End the generator if we're done
	
			if (!cursor) {
				finished = true;
				resolve(<IteratorResult<T>>{
					done: true
				});
				return;
			}
	
			let value = (<any>cursor).value;
			
			let mapResult = map? map(value) : value;
			let mapPromise : Promise<T>;

			if (!value || !value['then']) {
				// TODO: can we lock this to instanceof Promise safely?
				mapPromise = Promise.resolve(mapResult);
			}

			mapResult = await mapPromise;

			resolve(<IteratorResult<T>>{
				value: mapResult,
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
