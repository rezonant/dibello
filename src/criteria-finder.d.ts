import { Constraint } from '@dibello/constraint';
import { Repository } from '@dibello/repository';
export declare class CriteriaFinder<T> {
    private repository;
    constructor(repository: Repository<T>);
    /**
     * Determine equivalence between the given two values
     * including deep object equivalence
     *
     * @param {type} criteriaValue
     * @param {type} realValue
     * @returns {Boolean}
     */
    isEquivalent(criteriaValue: any, realValue: any): boolean;
    /**
     * Compile the given constraint, bestowing it with the _compiled section
     * and the proper operation function for use in checking values to see if
     * they match.
     *
     * @param {dibello.Constraint} constraint
     * @returns {undefined}
     */
    compileConstraint(constraint: any): void;
    /**
     * Resolve the criteria object so that all fields contain dibello.Constraint objects.
     *
     * @param {} criteria
     * @returns {}
     */
    resolveCriteria(criteria: any): {
        fieldName: string;
        constraint: Constraint;
    }[];
    /**
     * Implement filtering on the given items array by the given
     * constraint definition.
     *
     * @param {type} items
     * @param {type} constraint
     * @returns {undefined}
     */
    filterByConstraint(items: any, fieldName: any, constraint: any): any[];
    /**
     *
     * @param criteria
     */
    find(criteria: {
        [name: string]: any;
    }): AsyncIterableIterator<T>;
}
