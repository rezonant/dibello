import { Constraint } from './constraint';
import { Repository } from './repository';
import { idbRequestToIterable } from './utils/idb/request-to-iterable';
import { idbRequestToPromise } from './utils/idb/request-to-promise';
import { transact } from './transact';

export type Criteria = { [name : string] : any };
export type CriteriaFactory = ((...args) => Criteria);

export class CriteriaFinder<T> {
    constructor(private repository : Repository<T>) {

    }

    /**
     * Determine equivalence between the given two values 
     * including deep object equivalence
     * 
     * @param {type} criteriaValue
     * @param {type} realValue
     * @returns {Boolean}
     */
    isEquivalent(criteriaValue, realValue) {
        if (criteriaValue == realValue)
            return true;

        if (typeof criteriaValue !== 'object')
            return false;
        
        for (var key in criteriaValue) {
            if (this.isEquivalent(criteriaValue[key], realValue[key]))
                continue;
            
            return false;
        }

        return true;
    };

    /**
     * Compile the given constraint, bestowing it with the _compiled section
     * and the proper operation function for use in checking values to see if 
     * they match.
     * 
     * @param {dibello.Constraint} constraint
     * @returns {undefined}
     */
    compileConstraint(constraint) {
        var factories = ['bound'];
        var operations = {
            '=': (a, b) => a == b,
            '>': (a, b) => a > b,
            '<': (a, b) => a < b,
            '>=': (a, b) => a >= b,
            '<=': (a, b) => a <= b,
            'in': (a, b) => b.indexOf(a) >= 0,
            'bound': (constraint) => {

                var low = constraint.discriminant[0];
                var high = constraint.discriminant[1];
                var exclusiveLower = constraint.discriminant[2];
                var exclusiveUpper = constraint.discriminant[3];

                if (exclusiveLower === undefined)
                    exclusiveLower = false;
                if (exclusiveUpper === undefined)
                    exclusiveUpper = false;
                
                // Function map to implement each type of bound.
                // 'true' for exclusive on the low end and the high end.

                var bounds = {
                    truetrue:   function(v, d) { return low <  v && v <  high; },
                    falsefalse: function(v, d) { return low <= v && v <= high; },
                    truefalse:  function(v, d) { return low <  v && v <= high; },
                    falsetrue:  function(v, d) { return low <= v && v <  high; },
                };

                return bounds[exclusiveLower+''+exclusiveUpper];
            },
            'compound': (value, compoundConstraints : {fieldName : string, constraint : Constraint}[] ) => {
                for (let constraintPair of compoundConstraints) {
                    let { fieldName, constraint } = constraintPair;

                    if (fieldName[0] === '$')
                        continue;
                    
                    if (!this.filterByConstraint(value, fieldName, constraint))
                        return false;
                }
                
                return true;
            }
        };

        if (!operations[constraint.operator]) {
            throw "Unsupported operator '"+constraint.operator+"'";
        }

        constraint._compiled.fn = operations[constraint.operator];

        // A factory type (ie 'bound' above) will return the appropriate operation function
        // based on the constraint instead of registering a single operation function

        if (factories.indexOf(constraint.operator) >= 0)
            constraint._compiled.fn = constraint._compiled.fn(constraint);	
    }
        
    /**
     * Resolve the criteria object so that all fields contain dibello.Constraint objects.
     * 
     * @param {} criteria
     * @returns {}
     */
    resolveCriteria(criteria): { fieldName : string, constraint : Constraint }[] {
        return Object.keys(criteria)
            .filter(x => !x.startsWith('$'))
            .filter(x => criteria[x])
            .map(fieldName => {
                let constraint : Constraint = criteria[fieldName];
                if (constraint instanceof Constraint)
                    return { fieldName, constraint };

                // If the user provided a simple value, 
                // convert it to a simple constraint...
                
                if (typeof constraint === 'object') {
                    var compoundConstraints = this.resolveCriteria(constraint);
                    constraint = Constraint.compound(compoundConstraints);
                } else {
                    constraint = Constraint.equalTo(constraint);
                }
            
                return { fieldName, constraint };
            })
        ;
    }
    
    /**
     * Implement filtering on the given items array by the given
     * constraint definition. 
     * 
     * @param {type} items
     * @param {type} constraint
     * @returns {undefined}
     */
    filterByConstraint(item, fieldName, constraint) {
        // Cache the operation function on the constraint object.
        if (!constraint._compiled || !constraint._compiled.fn || constraint._compiled.operator != constraint.operator)
            this.compileConstraint(constraint);

        // Filter the item by our compiled operation function.
        if (!constraint._compiled.fn(item[fieldName], constraint.discriminant))
            return false;
        
        return true;
    }

    /**
     * 
     * @param criteria 
     */
    async *find(criteria : CriteriaFactory | Criteria): AsyncIterableIterator<T> {

        var self = this;
        let constraints : { fieldName : string, constraint : Constraint }[];
        let db = await this.repository.ready;
        if (typeof criteria === 'function') {
            criteria = await transact<Criteria>(db, null, function(db, name, transaction) {
                return db.repository(name, transaction);
            }, <CriteriaFactory>criteria, 'readonly', {
                is: function() {
                    return Constraint;
                }
            });
        }
        
        // Prepare a transaction (or use our existing one)
        // and an object store

        let tx = this.repository.getStoreTransaction(db);
        let store = tx.objectStore(this.repository.storeName);
        let promise = Promise.resolve(null);

        // Resolve the entire criteria object into the proper
        // set of Criteria instances if they aren't already
        
        constraints = this.resolveCriteria(criteria);

        // If the resolved constraints are empty, then this is just 
        // an all() request, so return openCursor().

        if (constraints.length == 0) {
            for await (let item of idbRequestToIterable<T>(store.openCursor())) {
                yield item;
            }
            return;
        }
        
        let firstConstraint = constraints[0];
        let sourceIndex : any = store;
        let idbQuery = undefined;
        
        // First constraint is handled specially.
        // If we have an index, we'll use IDB to sort the set by that index.
        // And if idbQuery is not null (which is only available for equality constraints)
        // we will use IDB to filter the data set as well.
        
        if (store.indexNames.contains(firstConstraint.fieldName)) {
            sourceIndex = store.index(firstConstraint.fieldName);
            idbQuery = firstConstraint.constraint.idb;
        }

        // Now, we must go through each of the constraints (including the first one, because 
        // it may not have been a simple equality constraint, which is all IDB can do for us)
        // and filter the results.

        for await (let item of idbRequestToIterable<T>(sourceIndex.openCursor(idbQuery))) {
            let matches = true;

            for (let constraintPair of constraints) {
                let { fieldName, constraint } = constraintPair;

                // If this is not our first constraint, filter
                // the items list with the constraint.
                
                if (!this.filterByConstraint(item, fieldName, constraint)) {
                    matches = false;
                    break;
                }
            }

            if (matches) {
                yield item;
            }
        }
    }
}