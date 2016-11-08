import * as $ from "jquery";
import { Promise } from "es6-promise";

import { KVStore } from "../../../common/js/KVStore";

export class LayoutData {
    private readonly xhr: JQueryXHR;
    private readonly pageDomStore = new KVStore<Element>();

    constructor(url: string) {
        this.xhr = $.ajax({
            url,
            dataType: "html",
            method: "GET"
        });
    }

    public getData() {
        const xhr = this.xhr;
        const promise = new Promise<this>((resolve, reject) => {
            xhr
                .done((html: string) => {
                    if (this.pageDomStore.getKeys().length === 0) {
                        // Store the parsed HTML into map of <section /> elements, one for each "page"
                        const pageDOMs: Element[] = $.parseHTML(html, undefined, true);

                        pageDOMs.forEach((pageElem) => {
                            const pageName: string = $(pageElem).data("name");

                            if (pageName) {
                                this.pageDomStore.put(pageName, pageElem);
                            }
                        });
                    }

                    resolve(this);
                })
                .fail(reject);
        });

        return {
            promise,
            xhr,
        };
    }

    public getLayout(layoutName: string) {
        const {promise, xhr} = this.getData();

        const layoutPromise = promise
            .then((layoutDataObj) => {
                const layoutElement = layoutDataObj.pageDomStore.get(layoutName);

                if (!layoutElement) {
                    throw new Error(`Layout "${layoutName}" not available`);
                }

                // Must clone the element node, otherwise page reloads point
                //   to the same DOM element
                return layoutElement.cloneNode(true) as Element;
            });

        return {
            promise: layoutPromise,
            xhr,
        }
    }

    public abort() {
        this.xhr.abort();
    }
}