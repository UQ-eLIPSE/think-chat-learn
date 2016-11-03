import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

export class QuizSchedulesCreate extends ComponentRenderable {
    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc(() => {

        });

        this.setDestroyFunc(() => {

        });

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
        this.section$(".create-only").show();
        this.section$(".edit-only").hide();
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

    // private readonly processAction = (action: string) => {
    //     switch (action) {
    //         case "reset": {
    //             this.emptySidebar();
    //             return;
    //         }


    //         case "create": {
    //             this.renderSidebarComponent<Home>("home");
    //             return;
    //         }

    //         // case "quizzes":
    //         //     break;

    //         case "marking": {
    //             this.renderSidebarComponent<Marking>("marking");
    //             return;
    //         }

    //         // case "users":
    //         //     break;

    //         case "system": {
    //             this.renderSidebarComponent<System>("system");
    //             return;
    //         }

    //         default: {
    //             const className: string = (<any>this.constructor).name || "[class]";
    //             this.dispatchError(new Error(`Action "${action}" is not recognised by ${className}`));
    //         }
    //     }
    // }
}