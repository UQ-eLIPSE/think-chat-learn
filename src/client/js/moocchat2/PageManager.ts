import * as $ from "jquery";

/**
 * MOOCchat
 * Page manager class module
 * 
 * Manages swapping in and out of pages
 */
export class PageManager {
    private $contentElem: JQuery;

    /**
     * @param {JQuery} $contentElem JQuery wrapped element serving as the container for page content where pages are to be swapped in/out
     */
    constructor($contentElem: JQuery) {
        this.$contentElem = $contentElem;
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

        pageFetchXHR.done((html: string) => {
            this.$contentElem.html(html);

            if (onDone) {
                onDone(this.page$.bind(this));
            }
        });

        return pageFetchXHR;
    }
}
