import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel } from "./AdminPanel";

export class Home extends ComponentRenderable {
    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setRenderFunc(() => {
            new Layout("admin-main", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.setupPageInitial)
                .then(this.renderName)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly setupPageInitial = () => {
        this.dispatch("setSectionActive", "home", true);
    }

    private readonly renderName = () => {
        // Get AJAX functions from the AdminPanel which sits at the top level
        const topLevelParent = this.getTopLevelParent();

        if (!(topLevelParent instanceof AdminPanel)) {
            return this.dispatchError(new Error(`Top level parent is not AdminPanel`));
        }

        this.$("#name").text(topLevelParent.getLti().getData().lis_person_name_full!);
    }
}