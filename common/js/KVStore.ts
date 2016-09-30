export class KVStore<T> {
    private kvStore: { [key: string]: T };

    constructor() {
        this.empty();
    }

    get(key: string) {
        return this.kvStore[key];
    }

    put(key: string, value: T) {
        this.kvStore[key] = value;
    }

    delete(key: string) {
        delete this.kvStore[key];
    }

    empty() {
        this.kvStore = {};
    }

    getKeys() {
        return Object.keys(this.kvStore);
    }

    getValues() {
        return this.getKeys().map(id => this.kvStore[id]);
    }
}