import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

export class QuestionBankSidebarEmpty extends ComponentRenderable {
    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setRenderFunc(() => {
            new Layout("admin-question-bank-sidebar-empty", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.setupCreateLink)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly setupCreateLink = () => {
        this.section$("#create-question").one("click", () => {
            this.dispatch("create", undefined, true);
        });
    }
}