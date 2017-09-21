import { Repository } from '@dibello/repository';
import { Database } from '@dibello/database';
import { idbRequestToPromise } from '@dibello/utils/idb/request-to-promise';
import { idbRequestToIterable } from '@dibello/utils/idb/request-to-iterable';

export class Index<TModel, TIndex> {
    constructor(repository : Repository<TModel>, name : string) {
        this._name = name;
    }

    private _repository : Repository<TModel>;
    private _name: string;

    public get repository() { return this._repository; }
    public get name() { return this._name; }

    async count() {
        let db = await this.repository.ready; 
        let tx = this._repository.getStoreTransaction(db);
        let store = tx.objectStore(this._repository.storeName);
        let index = store.index(this.name);
        
        return idbRequestToPromise<number>(index.count());
    };

    /**
     * Fetch the record which has a matching value for the current index.
     * @param key 
     */
    async get(key): Promise<any> {
        let db = await this._repository.ready; 
    
        var tx = this._repository.getStoreTransaction(db);
        var store = tx.objectStore(this._repository.storeName);
        var index = store.index(this.name);
        
        return idbRequestToPromise(index.get(key));
    }

    /**
     * Fetch the primary key of the record which has a matching value for the current index.
     * @param key 
     */
    async getKey(key): Promise<any> {
        var self = this;
          
        let db = await this._repository.ready;
        var tx = this._repository.getStoreTransaction(db);
        var store = tx.objectStore(this._repository.storeName);
        var index = store.index(this.name);
        
        return idbRequestToPromise(index.getKey(key));
    }

    cursor(range): AsyncIterable<TModel> {
        let db : Database;
        return idbRequestToIterable<TModel>(
            (async () => {
                db = await this._repository.ready;
                let tx = this._repository.getStoreTransaction(db);
                let store = tx.objectStore(this._repository.storeName);
                let index = store.index(this.name);
                
                return index.openCursor(range);
            })(),
            x => this._repository._hydrateItem(db, x)
        );
    }

    /**
     * Get a cursor across the keys in the index 
     * TODO: does this provide the primary key or the key within this index?
     * @param range 
     */
    keyCursor(range): AsyncIterable<TIndex> {
        
        let db : Database;
        return idbRequestToIterable(
            (async () => {
                db = await this._repository.ready;
                let tx = this._repository.getStoreTransaction(db);
                let store = tx.objectStore(this._repository.storeName);
                let index = store.index(this.name);
                
                return index.openCursor(range);
            })()
        );
    }
};