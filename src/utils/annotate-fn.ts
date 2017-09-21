/**
 * # dibello/utils/annotateFn
 * 
 * A light-weight Javascript function reflector, similar to the one found in Angular.js.
 * Also supports array-style annotations for mangler-friendly code.
 *
 * @module dibello/utils/annotateFn
 * @author William Lahti <wilahti@gmail.com>
 * @copyright (C) 2015 William Lahti  
 */


var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

/**
 * 
 * @param {type} fn
 * @returns {object} An object containing 'params' and 'fn'. 'params' is an array of strings (parameter names). 'fn'
 *		will be the function that should be called.
 */
export function annotateFn(fn) {

	if (typeof fn === 'undefined') {
		return {
			fn: function() { },
			params: []
		};
	}
	
	if (typeof fn === 'object' && fn.length !== undefined) {
		var params = fn;
		fn = params[params.length - 1];
		params.pop();

		return {
			fn: fn,
			params: params
		};
	}

	if (typeof fn === 'string') {
		console.log('A string was passed to annotateFn()');
		throw 'A string was passed to annotateFn()';
	}

	var $params;
	if (!($params = fn.$params)) {
		$params = [];
		var fnText = fn.toString().replace(STRIP_COMMENTS, '');
		var argDecl = fnText.match(FN_ARGS);
		
		if (!argDecl) {
			console.log("Failed to parse function declaration: "+fnText);
			throw "Failed to parse function declaration: "+fnText;
		}
		
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
}