export async function iteratorCollect<T>(iterator : AsyncIterable<T>, callback : (items : T[]) => void) {
    let items = [];
    for await (let item of iterator)
        items.push(item);
    callback(items);
}