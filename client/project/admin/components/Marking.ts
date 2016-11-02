import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

export class Marking extends ComponentRenderable {
    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setRenderFunc(() => {
            new Layout("admin-marking", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(() => {
                    this.dispatch("setSectionActive", "marking", true);
                })
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }
}