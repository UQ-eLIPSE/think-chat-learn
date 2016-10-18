import {PageManager} from "./PageManager";

import * as $ from "jquery";

import {EventBox} from "../../common/js/EventBox";

export class CombinedPageManager extends PageManager {
    private combinedPageXHR: JQueryXHR;
    private combinedPageDOM: {[name: string]: Element} = {};

    constructor(sharedEventManager: EventBox, $contentElem: JQuery, combinedPageUrl: string) {
        super(sharedEventManager, $contentElem);

        this.combinedPageXHR = $.ajax({
            url: combinedPageUrl,
            dataType: "html",
            method: "GET"
        });
        
        this.combinedPageXHR.done((html: string) => {
            // Store the parsed HTML into map of <section /> elements, one for each "page"
            const pageDOMs: Element[] = $.parseHTML(html, undefined, true);
            
            pageDOMs.forEach((pageElem) => {
                const pageName: string = $(pageElem).data("name");

                if (pageName) {
                    this.combinedPageDOM[pageName] = pageElem;
                }
            });
        });
    }

    public loadPage(name: string, onDone?: (page$: (selector?: string) => JQuery) => void) {
        const loadStartTime = new Date().getTime();

        this.combinedPageXHR.done(() => {
            // Find the requested page element
            const requestedPageElem = this.combinedPageDOM[name];

            if (!requestedPageElem) {
                // throw new Error("Page not found");
                console.error(`Page "${name}"" not found`);
                return;
            }

            // Render this requested page element from the combined page
            // MUST clone the element node, otherwise page reloads point to the same DOM element
            this.render(name, requestedPageElem.cloneNode(true) as Element, loadStartTime, onDone);
        });
    }
}