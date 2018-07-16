import * as ckeditor from "ckeditor";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import * as ToClientData from "../../../../common/interfaces/ToClientData";

export class QuestionBankSectionContent extends ComponentRenderable {
    private questionContentEditor: ckeditor.editor | undefined;
    private question: ToClientData.Question | undefined;

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc((data?: ToClientData.Question) => {
            this.question = data;
        });

        this.setDestroyFunc(() => {
            this.questionContentEditor = undefined;
            this.question = undefined;
        });

        this.setRenderFunc(() => {
            return new Layout("admin-question-bank-section-content", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.hideContent)
                .then(this.insertData)
                .then(this.setupCkeditor)
                .then(this.showContent)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly hideContent = () => {
        this.section$().css("visibility", "hidden");
    }

    private readonly showContent = () => {
        this.section$().css("visibility", "visible");
    }

    private readonly insertData = () => {
        if (!this.question) {
            return;
        }

        this.section$("#title").val(this.question.title!);
        this.section$("#content").val(this.question.content!);
    }

    private readonly setupCkeditor = () => {
        this.questionContentEditor = ckeditor.replace(this.section$("#content")[0] as HTMLTextAreaElement);

        return new Promise<void>((resolve) => {
            this.questionContentEditor!.on("loaded", () => {
                resolve();
            });
        });
    }

    public readonly isRendered = () => {
        try {
            this.section$();
        } catch (e) {
            return false;
        }

        if (!this.questionContentEditor) {
            return false;
        }

        return true;
    }

    public readonly getTitle = () => {
        if (!this.isRendered()) {
            return;
        }

        return this.section$("#title").val() as string;
    }

    public readonly getContent = () => {
        if (!this.isRendered()) {
            return;
        }

        return this.questionContentEditor!.getData();
    }
}
