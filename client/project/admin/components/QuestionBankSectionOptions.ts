import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { XHRStore } from "../../../js/xhr/XHRStore";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";

import * as IMoocchatApi from "../../../../common/interfaces/IMoocchatApi";
import * as ToClientData from "../../../../common/interfaces/ToClientData";

export class QuestionBankSectionOptions extends ComponentRenderable {
    private ajaxFuncs: AjaxFuncFactoryResultCollection | undefined;

    private readonly xhrStore = new XHRStore();

    private question: ToClientData.Question | undefined;
    private questionOptions: ToClientData.QuestionOption[] = [];


    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc((data?: ToClientData.Question) => {
            this.question = data;

            this.fetchAjaxFuncs();
            this.xhrStore.empty();
        });

        this.setDestroyFunc(() => {
            this.question = undefined;

            this.xhrStore.abortAll();
            this.xhrStore.empty();
        });

        this.setRenderFunc(() => {
            new Layout("admin-question-bank-section-options", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                // .then(this.hideContent)
                .then(this.emptyQuestionOptions)
                .then(this.setupNewQuestionOptionBox)
                .then(this.setupOptionListControls)
                .then(this.fetchRenderQuestionData)
                // .then(this.showContent)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    // private readonly hideContent = () => {
    //     this.section$().css("visibility", "hidden");
    // }

    // private readonly showContent = () => {
    //     this.section$().css("visibility", "visible");
    // }

    public readonly getQuestionOptions = () => {
        return this.getQuestionOptions;
    }

    private readonly fetchAjaxFuncs = () => {
        // Get AJAX functions from the AdminPanel which sits at the top level
        const topLevelParent = this.getTopLevelParent();

        if (!(topLevelParent instanceof AdminPanel)) {
            return this.dispatchError(new Error(`Top level parent is not AdminPanel`));
        }

        this.ajaxFuncs = topLevelParent.generateAjaxFuncFactory()();
    }

    private readonly loadQuestionOptionData = () => {
        const xhrCall = this.ajaxFuncs!.get<IMoocchatApi.ToClientResponseBase<ToClientData.QuestionOption[]>>
            (`/api/admin/question/${this.question!._id}/option`);

        // Store in XHR store to permit aborting when necessary
        const xhrObj = xhrCall.xhr;
        const xhrId = this.xhrStore.add(xhrObj);

        // Remove once complete
        xhrCall.promise.then(() => {
            this.xhrStore.remove(xhrId);
        });

        xhrCall.promise
            .then(_ => this.cullBadData(_))
            .then((data) => {
                this.questionOptions = data.payload;
            });

        return xhrCall.promise;
    }

    private readonly cullBadData = <T>(data: IMoocchatApi.ToClientResponseBase<T>) => {
        if (!data.success) {
            throw data.message;
        }

        return data;
    }

    private readonly submitNewQuestionOption = (content: string, sequence: number) => {
        const xhrCall = this.ajaxFuncs!.post<IMoocchatApi.ToClientResponseBase<IMoocchatApi.ToClientInsertionIdResponse>>
            (`/api/admin/question/${this.question!._id}/option`, {
                content: content,
                sequence: sequence,
            });

        // Store in XHR store to permit aborting when necessary
        const xhrObj = xhrCall.xhr;
        const xhrId = this.xhrStore.add(xhrObj);

        // Remove once complete
        xhrCall.promise.then(() => {
            this.xhrStore.remove(xhrId);
        });

        return xhrCall.promise;
    }

    private readonly submitDeleteQuestionOption = (optionId: string) => {
        const xhrCall = this.ajaxFuncs!.delete<IMoocchatApi.ToClientResponseBase<void>>
            (`/api/admin/question/${this.question!._id}/option/${optionId}`);

        // Store in XHR store to permit aborting when necessary
        const xhrObj = xhrCall.xhr;
        const xhrId = this.xhrStore.add(xhrObj);

        // Remove once complete
        xhrCall.promise.then(() => {
            this.xhrStore.remove(xhrId);
        });

        return xhrCall.promise;
    }

    private readonly submitEditQuestionOption = (option: ToClientData.QuestionOption) => {
        const xhrCall = this.ajaxFuncs!.put<IMoocchatApi.ToClientResponseBase<void>>
            (`/api/admin/question/${this.question!._id}/option/${option._id}`, {
                content: option.content,
                sequence: option.sequence,
            });

        // Store in XHR store to permit aborting when necessary
        const xhrObj = xhrCall.xhr;
        const xhrId = this.xhrStore.add(xhrObj);

        // Remove once complete
        xhrCall.promise.then(() => {
            this.xhrStore.remove(xhrId);
        });

        return xhrCall.promise;
    }

    private readonly onNewQuestionOption = (content: string) => {
        // Get the last sequence number
        const $last = this.section$("#option-list > *").not(".new").last();
        const lastQuestionOption = ($last.data("questionOption") as ToClientData.QuestionOption) || undefined;
        const sequence = lastQuestionOption ? lastQuestionOption.sequence + 1 : 0;

        if (this.question) {

            return this.submitNewQuestionOption(content, sequence)
                .then(_ => this.cullBadData(_))
                .then(this.loadQuestionOptionData)
                .then(_ => this.cullBadData(_))
                .then((data) => {
                    this.renderQuestions(data.payload);
                });
        } else {
            return new Promise((resolve) => {
                // Push to array            
                // We have no question to tie to, so we will be making the information up as best we can
                this.questionOptions.push({
                    _id: undefined,
                    content,
                    questionId: undefined,
                    sequence,
                });

                resolve();
            })
                .then(() => {
                    this.renderQuestions(this.questionOptions);
                });
        }
    }

    private readonly onDeleteQuestionOption = (questionOption: ToClientData.QuestionOption) => {
        if (this.question) {
            return this.submitDeleteQuestionOption(questionOption._id!)
                .then(_ => this.cullBadData(_))
                .then(this.loadQuestionOptionData)
                .then(_ => this.cullBadData(_))
                .then((data) => {
                    this.renderQuestions(data.payload);
                });
        } else {
            return new Promise((resolve) => {
                // Remove question option element
                const index = this.questionOptions.indexOf(questionOption);
                this.questionOptions.splice(index, 1);

                resolve();
            })
                .then(() => {
                    this.renderQuestions(this.questionOptions);
                });
        }
    }

    private readonly onSwapOrderQuestionOption = (questionOption1: ToClientData.QuestionOption, questionOption2: ToClientData.QuestionOption) => {
        // Modify question option objects to swap sequence numbers
        const a = questionOption1.sequence;
        const b = questionOption2.sequence;

        questionOption1.sequence = b;
        questionOption2.sequence = a;

        // Submit both changed question option objects
        if (this.question) {
            return Promise.all([
                this.submitEditQuestionOption(questionOption1),
                this.submitEditQuestionOption(questionOption2),
            ])
                .then(_arr => {
                    _arr.forEach(_ => this.cullBadData(_));
                })
                .then(this.loadQuestionOptionData)
                .then(_ => this.cullBadData(_))
                .then((data) => {
                    this.renderQuestions(data.payload);
                });
        } else {
            return new Promise((resolve) => {
                this.renderQuestions(this.questionOptions);

                resolve();
            }) as Promise<void>;
        }
    }

    private readonly setupNewQuestionOptionBox = () => {
        const $newBox = this.section$("#option-list .new");

        $newBox.on("keydown", (e) => {
            // Capture ENTER key
            if (e.keyCode === 13) {
                e.preventDefault();

                const content = $.trim($newBox.text());

                // Only continue if we actually have something to save
                if (content.length === 0) {
                    return;
                }

                // Pass content to new question option POSTer
                this.onNewQuestionOption(content)
                    .catch(this.dispatchError);

                $newBox.empty();
            }
        });
    }

    private readonly setupOptionListControls = () => {
        this.section$("#option-list")
            .on("click", ".option-controls a", (e) => {
                e.preventDefault();

                const $elem = $(e.currentTarget);
                const $optionItem = $elem.closest(".option-item");
                const questionOption = $optionItem.data("questionOption") as ToClientData.QuestionOption;

                switch ($elem.text().toLowerCase()) {
                    case "up": {
                        const $optionItemPrev = $optionItem.prev();

                        if ($optionItemPrev.length === 0) {
                            return;
                        }

                        const questionOptionPrev = $optionItemPrev.data("questionOption") as ToClientData.QuestionOption;

                        return this.onSwapOrderQuestionOption(questionOption, questionOptionPrev);
                    }
                    case "down": {
                        const $optionItemNext = $optionItem.next().not(".new");

                        if ($optionItemNext.length === 0) {
                            return;
                        }

                        const questionOptionNext = $optionItemNext.data("questionOption") as ToClientData.QuestionOption;

                        return this.onSwapOrderQuestionOption(questionOption, questionOptionNext);
                    }
                    case "edit": return;
                    case "delete": return this.onDeleteQuestionOption(questionOption);
                }

                return;
            });
    }

    private readonly emptyQuestionOptions = () => {
        this.section$("#option-list > *").not(".new").remove();
    }

    private readonly renderQuestions = (questionOptions: ToClientData.QuestionOption[]) => {
        this.emptyQuestionOptions();

        const $a = (text: string) => $("<a>").text(text);

        const generateControls = () => {
            return [
                $a("Up"), " ",
                $a("Down"), " ",
                $a("Edit"), " ",
                $a("Delete"),
            ]
        }

        this.section$("#option-list").prepend(
            questionOptions
                .sort((a, b) => {
                    // Order by sequence number
                    if (a.sequence === b.sequence) { return 0; }
                    return (a.sequence < b.sequence) ? -1 : 1;
                })
                .map(questionOption =>
                    $("<div>")
                        .addClass("option-item")
                        .data("questionOption", questionOption)
                        .text(questionOption.content!)
                        .append($("<div>")
                            .addClass("option-controls")
                            .append(generateControls())
                        )
                )
        )
    }

    private readonly fetchRenderQuestionData = () => {
        if (!this.question) {
            return;
        }

        return this.loadQuestionOptionData()
            .then(_ => this.cullBadData(_))
            .then((data) => {
                this.renderQuestions(data.payload);
            });
    }
}
