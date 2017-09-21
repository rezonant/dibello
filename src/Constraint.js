
/**
 * Constructs a new dibello.Constraint.
 * @class 
 * @alias module:dibello.Constraint
 * @param {String} operator
 * @param {} discriminant
 * @param {IDBKeyRange} idb
 */
var Constraint = function(operator, discriminant, idb) {
	this.isConstraint = true;
	this.operator = operator;
	this.discriminant = discriminant;
	this.idb = idb;
	this._compiled = {
		operator: ''
	};
}; module.exports = Constraint;

function isValidKey(value) {
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
Constraint.greaterThan = function(value) {
	return new Constraint('>', value, !isValidKey(value)? null : IDBKeyRange.lowerBound(value));
};

/**
 * Match values greater than or equal to the given value
 * @static
 * @param {type} value
 * @returns {module:dibello.Constraint}
 */
Constraint.greaterThanOrEqualTo = function(value) {
	
	
	
	return new Constraint('>=', value, !isValidKey(value)? null : IDBKeyRange.lowerBound(value));
};

/**
 * @static
 * @param {type} value
 * @returns {module:dibello.Constraint}
 */
Constraint.lessThan = function(value) {
	return new Constraint('<', value, !isValidKey(value)? null : IDBKeyRange.upperBound(value));
};

Constraint.compound = function(object) {
	return new Constraint('compound', object, null);
}

/**
 * @static
 * @param {type} value
 * @returns {module:dibello.Constraint}
 */
Constraint.lessThanOrEqualTo = function(value) {
	return new Constraint('<=', value, !isValidKey(value)? null : IDBKeyRange.upperBound(value));
};

/**
 * Match values equal to the given value
 * @static
 * @param {type} value
 * @returns {module:dibello.Constraint}
 */
Constraint.equalTo = function(value) {
	return new Constraint('=', value, !isValidKey(value)? null : IDBKeyRange.only(value));
};

/**
 * Match values within the given bounds
 * @static
 * @param {type} value
 * @returns {module:dibello.Constraint}
 */
Constraint.inBounds = function(lower, upper, exclusiveLower, exclusiveUpper) {
	return new Constraint(
		'bound', 
		[lower, upper, exclusiveLower, exclusiveUpper], 
		IDBKeyRange.bound(lower, upper, exclusiveLower, exclusiveUpper)
	);
};

/**
 * Match values which fall within the given array of values
 * @static
 * @param {type} value
 * @returns {module:dibello.Constraint}
 */
Constraint.in = function(value) {
	return new Constraint('in', value, null);
};