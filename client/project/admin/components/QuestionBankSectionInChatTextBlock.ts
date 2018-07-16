import * as ckeditor from "ckeditor";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import * as ToClientData from "../../../../common/interfaces/ToClientData";

export class QuestionBankSectionInChatTextBlock extends ComponentRenderable {
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
            return new Layout("admin-question-bank-section-in-chat-text-block", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.hideContent)
                .then(this.insertData)
                .then(this.setupCkeditor)
                .then(this.setupEnableCheckbox)
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

        const inChatTextBlockValue = this.question.inChatTextBlock;

        if (inChatTextBlockValue) {
            this.section$("#enabled").prop("checked", true);
            this.section$("#content").val(this.question.inChatTextBlock!);
        } else {
            this.section$("#enabled").prop("checked", false);
            this.section$("#content").val("");
        }
    }

    private readonly setupCkeditor = () => {
        this.questionContentEditor = ckeditor.replace(this.section$("#content")[0] as HTMLTextAreaElement);

        return new Promise<void>((resolve) => {
            this.questionContentEditor!.on("loaded", () => {
                resolve();
            });
        });
    }

    private readonly setupEnableCheckbox = () => {
        const $enabledCheckbox = this.section$("#enabled");

        const onCheckboxChange = () => {
            const checked = $enabledCheckbox.is(":checked");

            // Show/hide editor depending on enabled checkbox
            if (checked) {
                this.questionContentEditor!.container.show();
            } else {
                this.questionContentEditor!.container.hide();
            }
        };

        // Attach event listener + run once now
        $enabledCheckbox.on("change", onCheckboxChange);
        onCheckboxChange();
    }

    public readonly isValueEnabled = () => {
        if (!this.isRendered()) {
            return false;
        }

        return this.section$("#enabled").is(":checked");
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

    public readonly getContent = () => {
        if (!this.isRendered() || !this.isValueEnabled()) {
            return;
        }

        return this.questionContentEditor!.getData();
    }
}
