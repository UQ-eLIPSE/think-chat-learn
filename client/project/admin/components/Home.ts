import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

export class Home extends ComponentRenderable {
    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setRenderFunc(() => {
            new Layout("admin-main", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(() => {
                    this.dispatch("setSectionActive", "home", true);
                })
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }
}