import { KVStore } from "../../../../common/js/KVStore";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

export class QuizSchedulesEdit extends ComponentRenderable {
    private readonly components = new KVStore<Component>();

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        const initFunc = () => {
            this.components.empty();
        }

        this.setInitFunc(initFunc);
        this.setDestroyFunc(initFunc);

        this.setRenderFunc(() => {
            new Layout("admin-quiz-schedule-edit-layout", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.showRelevantElements)
                .then(this.setupForm)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly showRelevantElements = () => {
        this.section$(".create-only").hide();
        this.section$(".edit-only").show();
    }

    private readonly setupForm = () => {
        // const parent = this.getParent();

        // if (!parent) {
        //     throw new Error("No parent");
        // }

        // this.section$("#create").one("click", () => {
        //     this.dispatch("load-list", undefined, true);
        //     this.dispatch("edit-id", id, true);
        // });
    }
}