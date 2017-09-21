/**
 * Converts an IDBRequest into a Promise
 * @returns {Promise}
 */
export function idbRequestToPromise<T>(request: IDBRequest): Promise<T> {
	var cancelled = false;
	return new Promise(function(resolve, reject) {
		request.onsuccess = ev => {
			if (!ev.target)
				return;
		
			var result = (<any>ev.target).result;
			resolve(result);
		};

		request.onerror = ev => {
			reject(ev);
		};
	});
}; 