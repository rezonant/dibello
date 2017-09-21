/**
 * Constructs a new constraint.
 */
export declare class Constraint {
    constructor(operator: any, discriminant: any, idb: any);
    isConstraint: boolean;
    operator: string;
    discriminant: string;
    idb: any;
    _compiled: any;
    static isValidKey(value: any): boolean;
    /**
     * Match values greater than the given value
     * @static
     * @param {type} value
     * @returns {module:dibello.Constraint}
     */
    static greaterThan(value: any): Constraint;
    /**
     * Match values greater than or equal to the given value
     * @static
     * @param {type} value
     * @returns {module:dibello.Constraint}
     */
    static greaterThanOrEqualTo(value: any): Constraint;
    /**
     * @static
     * @param {type} value
     * @returns {module:dibello.Constraint}
     */
    static lessThan(value: any): Constraint;
    static compound(object: any): Constraint;
    /**
     * @static
     * @param {type} value
     * @returns {module:dibello.Constraint}
     */
    static lessThanOrEqualTo(value: any): Constraint;
    /**
     * Match values equal to the given value
     * @static
     * @param {type} value
     * @returns {module:dibello.Constraint}
     */
    static equalTo(value: any): Constraint;
    /**
     * Match values within the given bounds
     * @static
     * @param {type} value
     * @returns {module:dibello.Constraint}
     */
    static inBounds(lower: any, upper: any, exclusiveLower: any, exclusiveUpper: any): Constraint;
    /**
     * Match values which fall within the given array of values
     * @static
     * @param {type} value
     * @returns {module:dibello.Constraint}
     */
    static in(value: any): Constraint;
}
