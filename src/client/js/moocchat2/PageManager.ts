import * as $ from "jquery";

import {EventBox} from "./EventBox";

export const PageManager_Events = {
    PAGE_LOAD: "PM_PAGE_LOAD"
}

export interface IPageManager_PageLoad {
    name: string;
    loadTimeMs: number;
}

/**
 * MOOCchat
 * Page manager class module
 * 
 * Manages swapping in and out of pages
 */
export class PageManager {
    private $contentElem: JQuery;
    private eventBox: EventBox;

    /**
     * @param {JQuery} $contentElem JQuery wrapped element serving as the container for page content where pages are to be swapped in/out
     */
    constructor(eventBox: EventBox, $contentElem: JQuery) {
        this.$contentElem = $contentElem;
        this.eventBox = eventBox;

        this.$contentElem.on("click", "button, input[type=button]", (e) => {
            let $elem = $(e.currentTarget);
        });
    }

    /**
     * Returns the page content root element or $/jQuery of the selector within the context of the content root element.
     * 
     * @param {string} selector
     * 
     * @return {JQuery} 
     */
    public page$(selector?: string) {
        if (selector) {
            return $(selector, this.$contentElem);
        }

        return this.$contentElem;
    }

    /**
     * Loads requested page.
     * 
     * @param {string} name Name of the requested page
     * @param {Function} onDone Function to execute when page loaded
     * 
     * @return {JQueryXHR} Object from the AJAX page fetch  
     */
    public loadPage(name: string, onDone?: (page$?: (selector?: string) => JQuery) => void) {
        var pageFetchXHR = $.ajax({
            url: `./html/${name}.html`,
            dataType: "html",
            method: "GET"
        });

        let loadStartTime = new Date().getTime();

        pageFetchXHR.done((html: string) => {
            let loadEndTime = new Date().getTime();

            this.$contentElem.html(html);
            this.dispatchOnPageLoad({
                name: name,
                loadTimeMs: (loadEndTime - loadStartTime)
            });

            if (onDone) {
                onDone(this.page$.bind(this));
            }
        });

        return pageFetchXHR;
    }

    // public attachOnPageLoad(callback: (data: IPageManager_PageLoad) => void) {
    //     this.eventBox.on(PageManager_Events.PAGE_LOAD, callback);
    // }

    // public detachOnPageLoad(callback: (data: IPageManager_PageLoad) => void) {
    //     this.eventBox.off(PageManager_Events.PAGE_LOAD, callback);
    // }

    public dispatchOnPageLoad(data: IPageManager_PageLoad) {
        this.eventBox.dispatch(PageManager_Events.PAGE_LOAD, data);
    }
}
