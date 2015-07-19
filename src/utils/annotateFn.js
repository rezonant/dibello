/**
 * 
 * / ANNOTATEFN
 * /
 * / AUTHOR: William Lahti
 * / (C) 2015 William Lahti
 *
 * A light-weight Javascript function reflector, similar to the one found in Angular.js.
 * Also supports array-style annotations for mangler-friendly code.
 *
 */


var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function annotateFn(fn) {

	if (typeof fn === 'object' && fn.length !== undefined) {
		var params = fn;
		fn = params[params.length - 1];
		params.pop();

		return {
			fn: fn,
			params: params
		};
	}

	var $params;
	if (!($params = fn.$params)) {
		$params = [];
		var fnText = fn.toString().replace(STRIP_COMMENTS, '');
		var argDecl = fnText.match(FN_ARGS);
		var parts = argDecl[1].split(FN_ARG_SPLIT);

		for (var i = 0, max = parts.length; i < max; ++i) {
			var arg = parts[i];
			arg.replace(FN_ARG, function(all, underscore, name) {
				$params.push(name);
			});
		}

		fn.$params = $params;
	}

	return {
		fn: fn,
		params: fn.$params
	};
}; module.exports = annotateFn;