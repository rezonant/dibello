import { annotateFn } from './annotate-fn';

export class InjectionException extends Error { }

/**
 * A light-weight function dependency injector, similar to the one found in Angular.js.
 * Calls the given function, passing parameters to said function which have
 * names which match entries in the given map. 
 * 
 * @param {} map
 * @param {} self
 * @param function fn
 * @returns mixed The result of the function once called
 */
export function inject(map, self, fn) {
	
	var meta = annotateFn(fn);
	var params = meta.params;
	fn = meta.fn;
	
	var args = [];
	
	if (map.$populate$) {
		map.$populate$(params);
	}
	
	for (var i = 0, max = params.length; i < max; ++i) {
		var param = params[i];
		var factory = map[param];
		
		// We want to be able to inject services with names containing $ at the beginning, middle
		// or end as necessary, so we do not, as a matter of policy, inject any service that both 
		// starts and ends with '$' such as '$populate$' or '$any$'. Naturally the injectables 
		// object can make productive use of this fact to have 'private' methods.
		
		if (param.match(/\$.*\$$/)) {
			args.push(null);
			continue;
		}
		
		if (typeof factory === 'undefined') {
			
			if (map.$any$) {
				factory = map.$any$;
			} else {
				throw new InjectionException('No service factory for injected parameter '+param+' (Parameter must be a valid service)');
			}	
		}
		
		if (typeof factory === 'function') {
			args.push(factory(param, inject));
		} else {
			args.push(factory);
		}
		
	}
	
	return fn.apply(self, args);
}