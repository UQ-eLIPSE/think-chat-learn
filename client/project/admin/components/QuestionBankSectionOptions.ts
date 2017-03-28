import * as $ from "jquery";

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
            return new Layout("admin-question-bank-section-options", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.emptyQuestionOptions)
                .then(this.setupNewQuestionOptionBox)
                .then(this.setupOptionListControls)
                .then(this.fetchRenderQuestionData)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    public readonly getQuestionOptions = () => {
        return this.questionOptions;
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

        // Update question option cache
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
        const sequence = lastQuestionOption ? (lastQuestionOption.sequence || 0) + 1 : 0;

        if (this.question) {
            return this.submitNewQuestionOption(content, sequence)
                .then(_ => this.cullBadData(_))
                .catch((err) => {
                    // Just present the error; permit question options to be reloaded
                    alert(`${err}`);
                })
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
        // Maintain at least one question option
        if (this.getQuestionOptions().length < 2) {
            return new Promise((resolve) => {
                alert("At least one question option is required");

                resolve();
            });
        }

        if (this.question) {
            return this.submitDeleteQuestionOption(questionOption._id!)
                .then(_ => this.cullBadData(_))
                .catch((err) => {
                    // Just present the error; permit question options to be reloaded
                    alert(`${err}`);
                })
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
                .catch((err) => {
                    // Just present the error; permit question options to be reloaded
                    alert(`${err}`);
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
            });
        }
    }

    private readonly detachUpdateQuestionOnBodyClick = () => {
        $("body").off("click.updateQuestionOnBodyClick");
    }

    private readonly onStartEditQuestionOption = ($optionItem: JQuery, questionOption: ToClientData.QuestionOption) => {
        // Remove controls from item
        const $optionControls = $(".option-controls", $optionItem);
        $optionControls.remove();

        const updateQuestionOnBodyClick = (e: JQueryEventObject) => {
            const $actualClickedElem = $(e.target);

            // If we're clicking inside the same element we're trying to edit
            // don't continue
            if ($actualClickedElem.closest($optionItem).length > 0) {
                return;
            }

            // Detach now (effectively makes this a once-only event)
            this.detachUpdateQuestionOnBodyClick();

            // Only if we were in edit mode shall we update
            if ($optionItem.hasClass("edit-mode")) {
                updateQuestion()
                    .catch((err) => { this.dispatchError(err) });
            }
        }

        const updateQuestion = () => {
            // Update question option with new text
            const content = $.trim($optionItem.text());

            // Only edit if we have content
            if (content.length !== 0) {
                questionOption.content = content;
            }

            // Remove update on click handler
            this.detachUpdateQuestionOnBodyClick();

            // Update question option
            if (this.question) {
                return this.submitEditQuestionOption(questionOption)
                    .then(_ => this.cullBadData(_))
                    .catch((err) => {
                        // Just present the error; permit question options to be reloaded
                        alert(`${err}`);
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
                });
            }
        }

        // Make item editable
        $optionItem
            .prop("contenteditable", true)
            .focus()
            .addClass("edit-mode")
            .on("keydown", (e) => {
                // Capture ENTER key
                if (e.keyCode === 13) {
                    e.preventDefault();
                    this.detachUpdateQuestionOnBodyClick();

                    return updateQuestion()
                        .catch((err) => { this.dispatchError(err) });
                }

                // Capture ESC key
                if (e.keyCode === 27) {
                    e.preventDefault();
                    this.detachUpdateQuestionOnBodyClick();

                    // Re-render from cache
                    return this.renderQuestions(this.questionOptions);
                }

                return;
            });

        // Deemphasise siblings
        $optionItem
            .siblings()
            .not(".new")
            .addClass("deemphasise disabled");

        // Update on click outside of element
        //   This is done within a setTimeout to delay attachment so we
        //   don't end up in a cycle where the click handler is triggered
        //   immediately after entering edit mode.
        //
        //   While it is possible to prevent this from happening by stopping
        //   the propagation of events from bubbling to <body>, that will
        //   cause other side effects that complicate handling this very
        //   feature (not picking up clicks in other option items etc.)
        setTimeout(() => {
            $("body").on("click.updateQuestionOnBodyClick", updateQuestionOnBodyClick);
        }, 0);
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

                // Don't do anything if disabled
                if ($optionItem.hasClass("disabled")) {
                    return;
                }

                switch ($elem.text().toLowerCase()) {
                    case "up": {
                        const $optionItemPrev = $optionItem.prev();

                        if ($optionItemPrev.length === 0) {
                            return;
                        }

                        const questionOptionPrev = $optionItemPrev.data("questionOption") as ToClientData.QuestionOption;

                        return this
                            .onSwapOrderQuestionOption(questionOption, questionOptionPrev)
                            .catch((err) => { this.dispatchError(err) });
                    }

                    case "down": {
                        const $optionItemNext = $optionItem.next().not(".new");

                        if ($optionItemNext.length === 0) {
                            return;
                        }

                        const questionOptionNext = $optionItemNext.data("questionOption") as ToClientData.QuestionOption;

                        return this
                            .onSwapOrderQuestionOption(questionOption, questionOptionNext)
                            .catch((err) => { this.dispatchError(err) });
                    }

                    case "edit":
                        return this.onStartEditQuestionOption($optionItem, questionOption);

                    case "delete":
                        return this
                            .onDeleteQuestionOption(questionOption)
                            .catch((err) => { this.dispatchError(err) });
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
                    return (a.sequence || 0) < (b.sequence || 0) ? -1 : 1;
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
