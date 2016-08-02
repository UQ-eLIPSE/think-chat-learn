import {PageManager} from "./PageManager";

import * as $ from "jquery";

import {EventBox} from "./EventBox";

export class CombinedPageManager extends PageManager {
    private combinedPageXHR: JQueryXHR;
    private combinedPageDOM: Element[];

    constructor(sharedEventManager: EventBox, $contentElem: JQuery, combinedPageUrl: string) {
        super(sharedEventManager, $contentElem);

        this.combinedPageXHR = $.ajax({
            url: combinedPageUrl,
            dataType: "html",
            method: "GET"
        });
        
        this.combinedPageXHR.done((html: string) => {
            // Store the parsed HTML into array of <section /> elements, one for each "page"
            this.combinedPageDOM = $.parseHTML(html, undefined, true);
        });
    }

    public loadPage(name: string, onDone?: (page$?: (selector?: string) => JQuery) => void) {
        const loadStartTime = new Date().getTime();

        this.combinedPageXHR.done(() => {
            // Find the requested element
            let requestedPageElem: Element;

            // this.combinedPageDOM should be loaded with the information by this time
            for (let i = 0; i < this.combinedPageDOM.length; ++i) {
                const pageElem = this.combinedPageDOM[i];
                if ($(pageElem).data("name") === name) {
                    requestedPageElem = pageElem;
                    break;
                }
            }

            if (!requestedPageElem) {
                // throw new Error("Page not found");
                return;
            }

            // Render this requested page element from the combined page
            this.render(requestedPageElem, loadStartTime, onDone);
        });
    }
}