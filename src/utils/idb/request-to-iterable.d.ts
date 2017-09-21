import "core-js/fn/symbol/async-iterator";
/**
 * Converts an IndexedDB IDBCursor into an async iterable.
 */
export declare function idbRequestToIterable<T>(request: IDBRequest | Promise<IDBRequest>, map?: (any) => T): AsyncIterable<T>;
