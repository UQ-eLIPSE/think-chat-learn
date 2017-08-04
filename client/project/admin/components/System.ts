import { XHRStore } from "../../../js/xhr/XHRStore";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";

import * as IMoocchatApi from "../../../../common/interfaces/IMoocchatApi";

export class System extends ComponentRenderable {
    private ajaxFuncs: AjaxFuncFactoryResultCollection | undefined;

    private readonly xhrStore = new XHRStore();

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc(() => {
            this.fetchAjaxFuncs();
            this.xhrStore.empty();
        });

        this.setDestroyFunc(() => {
            this.ajaxFuncs = undefined;
            
            this.xhrStore.abortAll();
            this.xhrStore.empty();
        });

        this.setRenderFunc(() => {
            return new Layout("admin-system-info", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.setSectionActive)
                .then(this.setupReloadButton)
                .then(this.fetchSystemInfo)
                .then(this.displaySystemInfo)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly fetchAjaxFuncs = () => {
        // Get AJAX functions from the AdminPanel which sits at the top level
        const topLevelParent = this.getTopLevelParent();

        if (!(topLevelParent instanceof AdminPanel)) {
            return this.dispatchError(new Error(`Top level parent is not AdminPanel`));
        }

        this.ajaxFuncs = topLevelParent.generateAjaxFuncFactory()();
    }

    private readonly setSectionActive = () => {
        this.dispatch("setSectionActive", "system", true);
    }

    private readonly setupReloadButton = () => {
        // Re-render on reload
        $("#reload", this.getRenderTarget()).on("click", () => { this.render() });
    }

    private readonly fetchSystemInfo = () => {
        // Fetch system info data via API
        const xhrCall = this.ajaxFuncs!.get<IMoocchatApi.ToClientResponseBase<any>>
            (`/api/admin/system/info`);

        // Store in XHR store to permit aborting when necessary
        const xhrObj = xhrCall.xhr;
        const xhrId = this.xhrStore.add(xhrObj);

        // Remove once complete
        xhrCall.promise.then(() => {
            this.xhrStore.remove(xhrId);
        });

        return xhrCall.promise;
    }

    private readonly displaySystemInfo = (data: IMoocchatApi.ToClientResponseBase<any>) => {
        if (!data.success) { throw data.message; }

        $("#sys-info", this.getRenderTarget()).text(JSON.stringify(data.payload, null, "  "));
    }
}
