// import { KVStore } from "../../../../common/js/KVStore";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

export class QuestionBank extends ComponentRenderable {
    // private readonly components = new KVStore<Component>();

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setRenderFunc(() => {
            new Layout("admin-question-bank-layout", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                // .then(this.setSectionActive)
                // .then(this.setupSubcomponents)
                // .then(this.setupTabs)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    // private readonly setSectionActive = () => {
    //     this.dispatch("setSectionActive", "quizzes", true);
    // }

    // private readonly setupSubcomponents = () => {
    //     const subcomponentRenderTarget = this.section$("> .main");

    //     this.components.put("home", new Home(subcomponentRenderTarget, this.getLayoutData(), this));
    //     this.components.put("quizzes", new Quizzes(subcomponentRenderTarget, this.getLayoutData(), this));
    //     this.components.put("marking", new Marking(subcomponentRenderTarget, this.getLayoutData(), this));
    //     this.components.put("system", new System(subcomponentRenderTarget, this.getLayoutData(), this));
    // }

    // private readonly setupTabs = () => {
    //     this.section$("> .tabs").on("click", "li", (e) => {
    //         const $linkElem = $(e.target);
    //         this.processTabAction($linkElem.data("action"));
    //     });
    // }

    // private readonly renderComponent = <ComponentType extends ComponentRenderable>(componentName: string) => {
    //     const component = this.components.get<ComponentType>(componentName);

    //     if (!component) {
    //         this.dispatchError(new Error(`No component named "${componentName}"`));
    //         return;
    //     }

    //     component.init();
    //     component.render();
    // }

    // private readonly processTabAction = (action: string) => {
    //     switch (action) {
    //         case "home": {
    //             this.renderComponent<Home>("home");
    //             return;
    //         }

    //         // case "quizzes":
    //         //     break;

    //         case "marking": {
    //             this.renderComponent<Marking>("marking");
    //             return;
    //         }

    //         // case "users":
    //         //     break;

    //         case "system": {
    //             this.renderComponent<System>("system");
    //             return;
    //         }

    //         default: {
    //             const className: string = (<any>this.constructor).name || "[class]";
    //             this.dispatchError(new Error(`Action "${action}" is not recognised by ${className}`));
    //         }
    //     }
    // }
}