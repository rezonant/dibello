/**
 *
 * @param {type} fn
 * @returns {object} An object containing 'params' and 'fn'. 'params' is an array of strings (parameter names). 'fn'
 *		will be the function that should be called.
 */
export declare function annotateFn(fn: any): {
    fn: any;
    params: any;
};
