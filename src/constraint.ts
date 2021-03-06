
/**
 * Constructs a new constraint.
 */
export class Constraint {
	constructor(operator, discriminant : string | { fieldName : string, constraint : Constraint }[], idb) {
		this.operator = operator;
		this.discriminant = discriminant;
		this.idb = idb;
		this._compiled = {
			operator: ''
		};
	}

	isConstraint : boolean = true;
	operator : string;
	discriminant : string | { fieldName : string, constraint : Constraint }[];
	idb : any; // TODO 
	_compiled : any; // TODO

	public static isValidKey(value) {
		if (value === undefined || value === null)
			return false;
		
		if (value === true || value === false)
			return false;
		
		return true;
	}

	/**
	 * Match values greater than the given value
	 * @static
	 * @param {type} value
	 * @returns {module:dibello.Constraint}
	 */
	public static greaterThan(value) {
		return new Constraint('>', value, !this.isValidKey(value)? null : IDBKeyRange.lowerBound(value, true));
	}

	/**
	 * Match values greater than or equal to the given value
	 * @static
	 * @param {type} value
	 * @returns {module:dibello.Constraint}
	 */
	public static greaterThanOrEqualTo(value) {
		return new Constraint('>=', value, !this.isValidKey(value)? null : IDBKeyRange.lowerBound(value));
	}

	/**
	 * @static
	 * @param {type} value
	 * @returns {module:dibello.Constraint}
	 */
	public static lessThan(value) {
		return new Constraint('<', value, !this.isValidKey(value)? null : IDBKeyRange.upperBound(value, true));
	}

	public static compound(constraints : { fieldName : string, constraint : Constraint }[]) {
		return new Constraint('compound', constraints, null);
	}

	/**
	 * @static
	 * @param {type} value
	 * @returns {module:dibello.Constraint}
	 */
	public static lessThanOrEqualTo(value) {
		return new Constraint('<=', value, !this.isValidKey(value)? null : IDBKeyRange.upperBound(value));
	}

	/**
	 * Match values equal to the given value
	 * @static
	 * @param {type} value
	 * @returns {module:dibello.Constraint}
	 */
	public static equalTo(value) {
		return new Constraint('=', value, !this.isValidKey(value)? null : IDBKeyRange.only(value));
	}

	/**
	 * Match values within the given bounds
	 * @static
	 * @param {type} value
	 * @returns {module:dibello.Constraint}
	 */
	public static inBounds(lower, upper, exclusiveLower, exclusiveUpper) {
		return new Constraint(
			'bound', 
			[lower, upper, exclusiveLower, exclusiveUpper], 
			IDBKeyRange.bound(lower, upper, exclusiveLower, exclusiveUpper)
		);
	}

	/**
	 * Match values which fall within the given array of values
	 * @static
	 * @param {type} value
	 * @returns {module:dibello.Constraint}
	 */
	public static in(value) {
		return new Constraint('in', value, null);
	}
}