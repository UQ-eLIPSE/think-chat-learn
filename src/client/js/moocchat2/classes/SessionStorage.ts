export class SessionStorage {
    private storage: {[key: string]: any};

    constructor() {
        this.clear();
    }

    public setItem(key: string, value: any) {
        this.storage[key] = value;
    }

    public getItem(key: string) {
        return this.storage[key];
    }

    public removeItem(key: string) {
        delete this.storage[key];
    }

    public clear() {
        this.storage = {};
    }
}