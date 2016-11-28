import * as $ from "jquery";

import { KVStore } from "../../../../common/js/KVStore";
import { XHRStore } from "../../../js/xhr/XHRStore";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";
import { QuestionBankSectionContent } from "./QuestionBankSectionContent";
import { QuestionBankSectionOptions } from "./QuestionBankSectionOptions";

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
        this.components.put("options", new QuestionBankSectionOptions(this.section$(".question-bank-section-options"), this.getLayoutData(), this));
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
        this.renderComponent("options");
    }

    private readonly setupForm = () => {
        const handler = () => {
            const sectionContentComponent = this.getComponent<QuestionBankSectionContent>("content");
            const sectionOptionsComponent = this.getComponent<QuestionBankSectionOptions>("options");

            const title = sectionContentComponent.getTitle();
            const content = sectionContentComponent.getContent();
            const questionOptions = sectionOptionsComponent.getQuestionOptions();

            if (!title || $.trim(title).length === 0) {
                return alert("Title must not be blank");
            }

            if (questionOptions.length === 0) {
                return alert("At least one question option is required");
            }

            // Prevent double clicks
            this.section$("#create").off("click", handler);


            const apiPost = <PayloadType>(url: string, data: any) => {
                const xhrCall = this.ajaxFuncs!.post<IMoocchatApi.ToClientResponseBase<PayloadType>>
                    (url, data);

                // Store in XHR store to permit aborting when necessary
                const xhrObj = xhrCall.xhr;
                const xhrId = this.xhrStore.add(xhrObj);

                return xhrCall.promise
                    .then((data) => {
                        // Remove once complete
                        this.xhrStore.remove(xhrId);
                        return data;
                    })
                    // Pick up if API call failed
                    .then(_ => this.cullBadData(_));
            }



            let newQuestionId: string;

            apiPost<IMoocchatApi.ToClientInsertionIdResponse>
                (`/api/admin/question`, {
                    title,
                    content,
                })
                .then((data) => {
                    // Keep track of new question ID
                    newQuestionId = data.payload.id;
                })
                .then(() => {
                    // Send posts for all question options -> wrap as Promises
                    const questionOptionPosts = questionOptions.map((questionOption) => {
                        return apiPost<IMoocchatApi.ToClientInsertionIdResponse>
                            (`/api/admin/question/${newQuestionId}/option`, {
                                content: questionOption.content,
                                sequence: questionOption.sequence,
                            });
                    });

                    return Promise.all(questionOptionPosts);
                })
                .then(() => {
                    this.loadQuestionIdInParent(newQuestionId);
                })
                .catch((error) => {
                    this.dispatchError(error);
                });
        }

        this.section$("#create").on("click", handler);
    }

    private readonly loadQuestionIdInParent = (id: string) => {
        const parent = this.getParent();

        if (!parent) {
            throw new Error("No parent");
        }

        this.dispatch("reload-list-edit-id", id, true);
    }
}
