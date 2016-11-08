import { XHRStore } from "../../../js/xhr/XHRStore";

import * as ckeditor from "ckeditor";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";

import * as IMoocchatApi from "../../../../common/interfaces/IMoocchatApi";

export class QuestionBankCreate extends ComponentRenderable {
    private ajaxFuncs: AjaxFuncFactoryResultCollection | undefined;
    private questionContentEditor: ckeditor.editor | undefined;

    private readonly xhrStore = new XHRStore();

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc(() => {
            this.fetchAjaxFuncs();

        });

        this.setDestroyFunc(() => {
            this.ajaxFuncs = undefined;

        });

        this.setRenderFunc(() => {
            new Layout("admin-question-bank-edit-layout", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.hideContent)
                .then(this.showRelevantElements)
                .then(this.setupCkeditor)
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

    private readonly hideContent = () => {
        this.section$().css("visibility", "hidden");
    }

    private readonly showContent = () => {
        this.section$().css("visibility", "visible");
    }

    private readonly showRelevantElements = () => {
        this.section$(".create-only").show();
        this.section$(".edit-only").hide();
    }

    private readonly setupCkeditor = () => {
        this.questionContentEditor = ckeditor.replace(this.section$("#content")[0] as HTMLTextAreaElement);
        
        return new Promise<void>((resolve) => {
            this.questionContentEditor!.on("loaded", () => {
                resolve();
            });
        });
    }

    private readonly setupForm = () => {
        this.section$("#create").one("click", () => {
            const title: string = this.section$("#title").val();
            const content: string = this.questionContentEditor!.getData();

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
