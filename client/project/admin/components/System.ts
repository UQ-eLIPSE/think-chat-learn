import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";

import * as IMoocchatApi from "../../../../common/interfaces/IMoocchatApi";

export class System extends ComponentRenderable {
    private ajaxFuncs: AjaxFuncFactoryResultCollection;

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc(() => {
            this.fetchAjaxFuncs();
        });

        this.setRenderFunc(() => {
            new Layout("admin-system-info", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.setupPageInitial)
                .then(this.fetchSystemInfo)
                .then(this.displaySystemInfo)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private fetchAjaxFuncs = () => {
        // Get AJAX functions from the AdminPanel which sits at the top level
        const topLevelParent = this.getTopLevelParent();

        if (!(topLevelParent instanceof AdminPanel)) {
            return this.dispatchError(new Error(`Top level parent is not AdminPanel`));
        }

        this.ajaxFuncs = topLevelParent.generateAjaxFuncFactory()();
    }

    private setupPageInitial = () => {
        // Set section active
        this.dispatch("setSectionActive", "system", true);

        // Re-render on reload
        $("#reload", this.getRenderTarget()).on("click", () => { this.render() });
    }

    private fetchSystemInfo = () => {
        // Fetch system info data via API
        return this.ajaxFuncs.get<IMoocchatApi.ToClientResponseBase<any>>
            (`/api/admin/system/info`).promise;
    }

    private displaySystemInfo = (data: IMoocchatApi.ToClientResponseBase<any>) => {
        if (!data.success) { throw data.message; }

        $("#sys-info", this.getRenderTarget()).text(JSON.stringify(data.payload, null, "  "));
    }
}
