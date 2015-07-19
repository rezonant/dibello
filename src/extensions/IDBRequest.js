/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 */

window.IDBRequest.prototype.finishes = function(cb) {
	this.__skate_onfinish = cb;
	return this;
};

window.IDBRequest.prototype.yield = function(cb) {
	this.onsuccess = function(ev) {
		var cursor = ev.target.result;
		
		if (!cursor) {
			
			// Ending naturally
			
			if (this.__skate_onfinish) {
				this.__skate_onfinish();
			}
			
			return;
		}
		
		var ret = cb(cursor.value);
		if (typeof ret === 'undefined')
			ret = true;
		
		if (ret) {
			cursor.continue();
		} else {
			
			// Ending early
			
			if (this.__skate_onfinish) {
				this.__skate_onfinish();
				return;
			}
		}
	};
	
	return this;
};

window.IDBRequest.prototype.succeeds = function(cb) {
	this.onsuccess = cb;
	return this;
};

window.IDBRequest.prototype.catch = function(cb) {
	this.onerror = cb;
	return this;
};
