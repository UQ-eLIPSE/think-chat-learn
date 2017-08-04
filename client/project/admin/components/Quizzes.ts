import { KVStore } from "../../../../common/js/KVStore";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { QuizSchedules } from "./QuizSchedules";
import { QuestionBank } from "./QuestionBank";

export class Quizzes extends ComponentRenderable {
    private activeComponent: Component | undefined;

    private readonly components = new KVStore<Component>();
    private $tabs: JQuery | undefined;

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc(() => {
            this.components.empty();
        });

        this.setDestroyFunc(() => {
            this.components.empty();
            this.$tabs = undefined;
            this.destroyActiveComponent();
        });

        this.setRenderFunc(() => {
            return new Layout("admin-quizzes", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.setSectionActive)
                .then(this.setupSubcomponents)
                .then(this.setupListeners)
                .then(this.setupTabs)
                .then(this.launchFirstTab)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly setSectionActive = () => {
        this.dispatch("setSectionActive", "quizzes", true);
    }

    private readonly setupSubcomponents = () => {
        const subcomponentRenderTarget = this.section$("> .main");

        this.components.put("quiz-schedules", new QuizSchedules(subcomponentRenderTarget, this.getLayoutData(), this));
        this.components.put("question-bank", new QuestionBank(subcomponentRenderTarget, this.getLayoutData(), this));
    }

    private readonly setupListeners = () => {
        const listenerApply = (action: string) => {
            // If the result of processAction is true, then we have performed
            //   an action and wish not to bubble it any further by returning
            //   `false` from the callback.
            this.on(action, (data) => (this.processAction(action, data) ? false : undefined));
        }

        listenerApply("view-question");
    }

    private readonly setupTabs = () => {
        this.$tabs = this.section$("> .tabs");

        this.$tabs.on("click", "li", (e) => {
            const $linkElem = $(e.target);

            this.processAction($linkElem.data("action"));
        });
    }

    private readonly launchFirstTab = () => {
        const $tabs = this.$tabs;

        if (!$tabs) {
            throw new Error(`No $tabs object`);
        }

        $tabs.children("li").eq(0).click();
    }

    private readonly destroyActiveComponent = () => {
        this.activeComponent && this.activeComponent.destroy();
        this.activeComponent = undefined;
    }

    private readonly renderComponent = <ComponentType extends ComponentRenderable>(componentName: string, data?: any) => {
        const component = this.components.get<ComponentType>(componentName);

        if (!component) {
            this.dispatchError(new Error(`No component named "${componentName}"`));
            return;
        }

        this.destroyActiveComponent();

        return component.init(data)
            .then(() => {
                this.activeComponent = component;
                return component.render();
            })
            .then(() => {
                return component;
            })
            .catch((error) => {
                this.dispatchError(error);
            });
    }

    private readonly setTabActive = (action: string) => {
        const $tabs = this.$tabs;

        if (!$tabs) {
            throw new Error(`No $tabs object`);
        }

        $tabs.find(`> li[data-action="${action}"]`).addClass("active")
            .siblings().removeClass("active");
    }

    private readonly processAction = (action: string, data?: any) => {
        switch (action) {
            case "quiz-schedules": {
                this.setTabActive(action);
                this.renderComponent<QuizSchedules>("quiz-schedules");
                return;
            }
            case "question-bank": {
                this.setTabActive(action);
                this.renderComponent<QuestionBank>("question-bank");
                return;
            }

            case "view-question": {
                const id: string = data;

                // Open question bank
                this.setTabActive("question-bank");
                const componentRenderPromise = this.renderComponent<QuestionBank>("question-bank");

                // Give up if rendering not possible or if component not there
                if (!componentRenderPromise) {
                    return true;    // true = We have attempted to process this action
                }

                // Pass message back down to question bank component
                componentRenderPromise
                    .then((questionBank) => {
                        questionBank.dispatch("view-question", id);
                    });

                return true;
            }

            default: {
                const className: string = (<any>this.constructor).name || "[class]";
                this.dispatchError(new Error(`Action "${action}" is not recognised by ${className}`));
            }
        }

        return false;
    }
}