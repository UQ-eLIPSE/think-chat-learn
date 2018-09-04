import { Promise } from "es6-promise";

import { KVStore } from "../../../../common/js/KVStore";
import { XHRStore } from "../../../js/xhr/XHRStore";

import * as PromiseError from "../../../../common/js/error/PromiseError";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";
import { QuestionBankSectionContent } from "./QuestionBankSectionContent";
import { QuestionBankSectionOptions } from "./QuestionBankSectionOptions";

import * as IMoocchatApi from "../../../../common/interfaces/IMoocchatApi";
import * as ToClientData from "../../../../common/interfaces/ToClientData";
import { QuestionBankSectionSystemChatPromptStatements } from "./QuestionBankSectionSystemChatPromptStatements";
export class QuestionBankEdit extends ComponentRenderable {
    private ajaxFuncs: AjaxFuncFactoryResultCollection | undefined;
    private readonly components = new KVStore<Component>();
    private question: ToClientData.Question | undefined;

    private readonly xhrStore = new XHRStore();

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc((question: ToClientData.Question) => {
            this.fetchAjaxFuncs();
            this.components.empty();
            this.question = question;
        });

        this.setDestroyFunc(() => {
            this.ajaxFuncs = undefined;
            this.components.getValues().forEach(component => component.destroy());
            this.components.empty();
            this.question = undefined;
        });

        this.setRenderFunc(() => {
            return new Layout("admin-question-bank-edit-layout", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.hideContent)
                .then(this.setupSubcomponents)
                .then(this.showRelevantElements)
                .then(this.renderQuestionInfo)
                .then(this.setupForm)
                .then(this.showContent)
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

    private readonly setupSubcomponents = () => {
        this.components.put("content", new QuestionBankSectionContent(this.section$(".question-bank-section-content"), this.getLayoutData(), this));
        this.components.put("options", new QuestionBankSectionOptions(this.section$(".question-bank-section-options"), this.getLayoutData(), this));
        this.components.put("system-chat-prompt-statements", new QuestionBankSectionSystemChatPromptStatements(this.section$(".question-bank-section-system-chat-prompt-statements"), this.getLayoutData(), this));
        // this.components.put("options", new QuestionOptions(this.section$("#question-options"), this.getLayoutData(), this));
    }

    private readonly hideContent = () => {
        this.section$().css("visibility", "hidden");
    }

    private readonly showContent = () => {
        this.section$().css("visibility", "visible");
    }

    private readonly showRelevantElements = () => {
        this.section$(".create-only").hide();
        this.section$(".edit-only").show();
    }

    private readonly getComponent = <ComponentType extends Component>(componentName: string) => {
        const component = this.components.get<ComponentType>(componentName);

        if (!component) {
            throw new Error(`No component named "${componentName}"`);
        }

        return component;
    }

    private readonly setupForm = () => {
        const $saveButton = this.section$("#save-changes");
        const $deleteButton = this.section$("#delete");

        const onSaveButtonClick = () => {
            const sectionContentComponent = this.getComponent<QuestionBankSectionContent>("content");
            const sectionSystemChatPromptStatements = this.getComponent<QuestionBankSectionSystemChatPromptStatements>("system-chat-prompt-statements");

            const title = sectionContentComponent.getTitle();
            const content = sectionContentComponent.getContent();
            // Get the system prompt statements, or `null` when disabled

            const systemChatPromptStatements = sectionSystemChatPromptStatements.getContent() || null;
            
            // Prevent double clicks
            $saveButton.off("click", onSaveButtonClick);

            const xhrCall = this.ajaxFuncs!.put<IMoocchatApi.ToClientResponseBase<void>>
                (`/api/admin/question/${this.question!._id}`, {
                    title,
                    content,
                    systemChatPromptStatements
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
                .catch((err) => {
                    alert(`${err}`);

                    // Reenable button
                    $saveButton.on("click", onSaveButtonClick);

                    throw new PromiseError.AbortChainError(err);
                })
                .then(() => {
                    // Load updated item in parent
                    this.loadQuestionIdInParent(this.question!._id!);
                })
                .catch((err) => {
                    PromiseError.AbortChainError.ContinueAbort(err);

                    this.dispatchError(err);
                });
        }

        const onDeleteButtonClick = () => {
            // Prevent double clicks
            $deleteButton.off("click", onDeleteButtonClick);

            const xhrCall = this.ajaxFuncs!.delete<IMoocchatApi.ToClientResponseBase<void>>
                (`/api/admin/question/${this.question!._id}`);

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
                .catch((err) => {
                    alert(`${err}`);

                    // Reenable button
                    $deleteButton.on("click", onDeleteButtonClick);

                    throw new PromiseError.AbortChainError(err);
                })
                .then(this.reloadQuestionsInParent)
                .catch((err) => {
                    PromiseError.AbortChainError.ContinueAbort(err);

                    this.dispatchError(err);
                });
        }

        $saveButton.on("click", onSaveButtonClick);
        $deleteButton.on("click", onDeleteButtonClick);
    }

    private readonly loadQuestionIdInParent = (id: string) => {
        const parent = this.getParent();

        if (!parent) {
            throw new Error("No parent");
        }

        this.dispatch("reload-list-edit-id", id, true);
    }

    private readonly reloadQuestionsInParent = () => {
        const parent = this.getParent();

        if (!parent) {
            throw new Error("No parent");
        }

        this.dispatch("reload-list-reset", undefined, true);
    }

    private readonly renderQuestionInfo = () => {
        this.section$("#id").text(this.question!._id || "?");
        this.section$("#title").val(this.question!.title || "");
        this.section$("#content").val(this.question!.content || "");

        // Render info
        const sectionContentComponent = this.getComponent<QuestionBankSectionContent>("content");
        const sectionOptionsComponent = this.getComponent<QuestionBankSectionOptions>("options");
        const sectionSystemChatPromptStatements = this.getComponent<QuestionBankSectionSystemChatPromptStatements>("system-chat-prompt-statements");

        return Promise.all([
            sectionContentComponent.init(this.question)
                .then(() => {
                    sectionContentComponent.render();
                }),
            sectionOptionsComponent.init(this.question)
                .then(() => {
                    sectionOptionsComponent.render();
                }),
            sectionSystemChatPromptStatements.init(this.question)
                .then(() => {
                    sectionSystemChatPromptStatements.render();
                })
        ]);
    }
}