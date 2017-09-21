export declare class InjectionException extends Error {
}
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
export declare function inject(map: any, self: any, fn: any): any;
