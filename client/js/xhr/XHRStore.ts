import "jquery";

import { KVStore } from "../../../common/js/KVStore";

export class XHRStore {
    private count: number = 0;
    private store = new KVStore<JQueryXHR>();

    constructor() {
        this.empty();
    }

    add(xhr: JQueryXHR) {
        const id = (++this.count).toString();
        this.store.put((++this.count).toString(), xhr);
        return id;
    }

    remove(id: number | string) {
        this.store.delete(id.toString());
    }

    empty() {
        this.store.empty();
    }
    
    abortAll() {
        this.store.getValues().forEach((xhr) => {
            xhr.abort();
        });
    }

}