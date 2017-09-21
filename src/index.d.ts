import { Repository } from '@dibello/repository';
export declare class Index<TModel, TIndex> {
    constructor(repository: Repository<TModel>, name: string);
    private _repository;
    private _name;
    readonly repository: Repository<TModel>;
    readonly name: string;
    count(): Promise<number>;
    /**
     * Fetch the record which has a matching value for the current index.
     * @param key
     */
    get(key: any): Promise<any>;
    /**
     * Fetch the primary key of the record which has a matching value for the current index.
     * @param key
     */
    getKey(key: any): Promise<any>;
    cursor(range: any): AsyncIterable<TModel>;
    /**
     * Get a cursor across the keys in the index
     * TODO: does this provide the primary key or the key within this index?
     * @param range
     */
    keyCursor(range: any): AsyncIterable<TIndex>;
}
