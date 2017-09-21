
// Standardize any prefixed implementations of IndexedDB

if (typeof window !== 'undefined') {
	let win : any = window;
	win.indexedDB = win.indexedDB || win.mozIndexedDB || win.webkitIndexedDB || win.msIndexedDB;
	win.IDBTransaction = win.IDBTransaction || win.webkitIDBTransaction || win.msIDBTransaction;
	win.IDBKeyRange = win.IDBKeyRange || win.webkitIDBKeyRange || win.msIDBKeyRange;
}