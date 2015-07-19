/**
 * / SKATE /
 * / AUTHOR: William Lahti <wilahti@gmail.com>
 * / (C) 2015 William Lahti
 * 
 */

window.Array.prototype.yield = function(cb) {
	for (var i = 0, max = this.length; i < max; ++i) {
		var ret = cb(this[i]);
		if (typeof ret === 'undefined')
			ret = true;
		
		if (!ret)
			return;
	}
};
