import * as $ from "jquery";

import {IPageManager_PageLoad} from "./IPageManager";

import {EventBox} from "../../../../common/js/classes/EventBox";

/**
 * MOOCchat
 * Page manager class module
 * 
 * Manages swapping in and out of pages
 */
export class PageManager {
    protected $contentElem: JQuery;
    private sharedEventManager: EventBox;

    /**
     * @param {JQuery} $contentElem JQuery wrapped element serving as the container for page content where pages are to be swapped in/out
     */
    constructor(sharedEventManager: EventBox, $contentElem: JQuery) {
        this.$contentElem = $contentElem;
        this.sharedEventManager = sharedEventManager;
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
        const pageFetchXHR = $.ajax({
            url: `./static/html/${name}.html`,
            dataType: "html",
            method: "GET"
        });

        const loadStartTime = new Date().getTime();

        pageFetchXHR.done((html: string) => {
            this.render(name, html, loadStartTime, onDone);
        });
    }

    /**
     * Fires page load event to the shared event manager for others to catch.
     */
    protected dispatchOnPageLoad(data: IPageManager_PageLoad) {
        this.sharedEventManager.dispatch(PageManager_Events.PAGE_LOAD, data);
    }

    protected render(name: string, elem: string | Element, loadStartTime: number, onDone?: (page$?: (selector?: string) => JQuery) => void) {
        const loadEndTime = new Date().getTime();

        if (typeof elem === "string") {
            this.$contentElem.html(elem);
        } else {
            this.$contentElem.empty().append(elem);
        }

        // Scroll to top to ensure clean start at top on every page load
        this.$contentElem.scrollTop(0);

        this.dispatchOnPageLoad({
            name: name,
            loadTimeMs: (loadEndTime - loadStartTime)
        });

        if (onDone) {
            onDone(this.page$.bind(this));
        }
    }
}

export const PageManager_Events = {
    PAGE_LOAD: "PM_PAGE_LOAD"
}
