var deepcopy = require('deepcopy');

function strip(obj) {
	if (obj === null)
		return;

	if (typeof obj !== 'object')
		return;

	if (obj.length) {
		for (var i = 0, max = obj.length; i < max; ++i) {
			strip(obj[i]);
		}
	} else {
		for (var key in obj) {
			if (key == '') continue;
			if (key[0] == '$')
				delete obj[key];
			else
				strip(obj[key]);
		}
	}
};

function stripCopy(obj) {
	var copy;
			
	//copy = angular.copy(obj);
	copy = deepcopy(obj);
	strip(obj);
	return obj;
};

module.exports = stripCopy;