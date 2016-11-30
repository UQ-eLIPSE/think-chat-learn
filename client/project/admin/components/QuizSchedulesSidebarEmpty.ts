import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

export class QuizSchedulesSidebarEmpty extends ComponentRenderable {
    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setRenderFunc(() => {
            return new Layout("admin-quiz-schedule-sidebar-empty", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.setupCreateLink)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly setupCreateLink = () => {
        this.section$("#create-quiz-schedule").one("click", () => {
            this.dispatch("create", undefined, true);
        });
    }
}