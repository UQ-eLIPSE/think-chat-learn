/*
 * MOOCchat
 * Page manager class module
 * 
 * Manages swapping in and out of pages
 */

import $ = require("jquery");

import {Utils} from "./Utils";

export class PageManager {
    private $contentElem: JQuery;

    constructor($contentElem: JQuery) {
        this.$contentElem = $contentElem;
    }

    public get elem() {
        return this.$contentElem;
    }

    public page$(selector?: string) {
        if (selector) {
            return $(selector, this.elem);
        }

        return this.elem;
    }

    public loadPage(name: string, onDone?: (page$: (_?: string) => JQuery) => void) {
        var pageFetchXHR = $.ajax({
            url: `./html/${name}.html`,
            dataType: "html",
            method: "GET"
        });

        pageFetchXHR.done((html: string) => {
            this.$contentElem.html(html);

            if (onDone) {
                onDone(this.page$.bind(this));
            }
        });

        return pageFetchXHR;
    }


}
