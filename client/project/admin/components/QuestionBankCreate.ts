import { KVStore } from "../../../../common/js/KVStore";
import { XHRStore } from "../../../js/xhr/XHRStore";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";
import { QuestionBankSectionContent } from "./QuestionBankSectionContent";

import * as IMoocchatApi from "../../../../common/interfaces/IMoocchatApi";

export class QuestionBankCreate extends ComponentRenderable {
    private ajaxFuncs: AjaxFuncFactoryResultCollection | undefined;

    private readonly components = new KVStore<Component>();
    private readonly xhrStore = new XHRStore();

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc(() => {
            this.fetchAjaxFuncs();
            this.components.empty();

        });

        this.setDestroyFunc(() => {
            this.ajaxFuncs = undefined;
            this.components.empty();

        });

        this.setRenderFunc(() => {
            new Layout("admin-question-bank-edit-layout", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.showRelevantElements)
                .then(this.setupSubcomponents)
                .then(this.setupForm)
                .then(this.renderSubcomponents)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly cullBadData = <T>(data: IMoocchatApi.ToClientResponseBase<T>) => {
        if (!data.success) {
            throw data.message;
        }

        return data;
    }

    private readonly fetchAjaxFuncs = () => {
        // Get AJAX functions from the AdminPanel which sits at the top level
        const topLevelParent = this.getTopLevelParent();

        if (!(topLevelParent instanceof AdminPanel)) {
            return this.dispatchError(new Error(`Top level parent is not AdminPanel`));
        }

        this.ajaxFuncs = topLevelParent.generateAjaxFuncFactory()();
    }

    private readonly showRelevantElements = () => {
        this.section$(".create-only").show();
        this.section$(".edit-only").hide();
    }

    private readonly setupSubcomponents = () => {
        this.components.put("content", new QuestionBankSectionContent(this.section$(".question-bank-section-content"), this.getLayoutData(), this));
        // this.components.put("edit", new QuizSchedulesEdit(subcomponentRenderTarget, this.getLayoutData(), this));
        // this.components.put("sidebar-empty", new QuizSchedulesSidebarEmpty(subcomponentRenderTarget, this.getLayoutData(), this));
    }

    private readonly getComponent = <ComponentType extends Component>(componentName: string) => {
        const component = this.components.get<ComponentType>(componentName);

        if (!component) {
            throw new Error(`No component named "${componentName}"`);
        }

        return component;
    }

    private readonly renderComponent = <ComponentType extends ComponentRenderable>(componentName: string, data?: any) => {
        const component = this.getComponent<ComponentType>(componentName);

        if (!component) {
            return;
        }

        component.init(data)
            .then(() => {
                component.render();
            })
            .catch((error) => {
                this.dispatchError(error);
            });
    }

    private readonly renderSubcomponents = () => {
        this.renderComponent("content");
    }

    private readonly setupForm = () => {
        this.section$("#create").one("click", () => {
            const sectionContentComponent = this.getComponent<QuestionBankSectionContent>("content");

            const title = sectionContentComponent.getTitle();
            const content = sectionContentComponent.getContent();

            const xhrCall = this.ajaxFuncs!.post<IMoocchatApi.ToClientResponseBase<IMoocchatApi.ToClientInsertionIdResponse>>
                (`/api/admin/question`, {
                    title,
                    content,
                });

            // Store in XHR store to permit aborting when necessary
            const xhrObj = xhrCall.xhr;
            const xhrId = this.xhrStore.add(xhrObj);

            xhrCall.promise
                .then((data) => {
                    // Remove once complete
                    this.xhrStore.remove(xhrId);
                    return data;
                })
                .then(_ => this.cullBadData(_))
                .then((data) => {
                    // Load newly inserted item via. parent
                    this.loadQuestionIdInParent(data.payload.id);
                })
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly loadQuestionIdInParent = (id: string) => {
        const parent = this.getParent();

        if (!parent) {
            throw new Error("No parent");
        }

        this.dispatch("reload-list-edit-id", id, true);
    }
}
