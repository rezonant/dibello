/**
 * A utility to make it easy to iterate over an async iterable when there's no support for it 
 * in your environment.
 * 
 * @param iterable The iterable to iterate over
 * @param callback The callback to call for each round.
 */
export async function iteratorForEach<T>(iterable : AsyncIterable<T>, callback : (result : IteratorResult<T>) => boolean) {
    for await (let item of iterable) {
        if (!callback({ value: item, done: false }))
            return;
    }
    callback({ value: undefined, done: true });
}