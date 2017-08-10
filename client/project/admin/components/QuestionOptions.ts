import { Promise } from "es6-promise";

// import { KVStore } from "../../../../common/js/KVStore";
import { XHRStore } from "../../../js/xhr/XHRStore";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

// import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";

import * as IMoocchatApi from "../../../../common/interfaces/IMoocchatApi";
import * as ToClientData from "../../../../common/interfaces/ToClientData";

export class QuestionOptions extends ComponentRenderable {
    private ajaxFuncs: AjaxFuncFactoryResultCollection | undefined;

    private readonly xhrStore = new XHRStore();

    private questionId: string | undefined;

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc((questionId: string) => {
            this.questionId = questionId;

            this.fetchAjaxFuncs();
            this.xhrStore.empty();
        });

        this.setDestroyFunc(() => {
            this.ajaxFuncs = undefined;

            this.xhrStore.abortAll();
            this.xhrStore.empty();
        });

        this.setRenderFunc(() => {
            this.loadAndRenderQuestionOptions()
                .then(this.setupForm)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
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
            (`/api/admin/question/${this.questionId}/option`);

        // Store in XHR store to permit aborting when necessary
        const xhrObj = xhrCall.xhr;
        const xhrId = this.xhrStore.add(xhrObj);

        // Remove once complete
        xhrCall.promise.then(() => {
            this.xhrStore.remove(xhrId);
        });

        return xhrCall.promise;
    }

    private readonly cullBadData = <T>(data: IMoocchatApi.ToClientResponseBase<T>) => {
        if (!data.success) {
            throw data.message;
        }

        return data;
    }

    private readonly renderQuestionOptions = (data: IMoocchatApi.ToClientResponseSuccess<ToClientData.QuestionOption[]>) => {
        this.$("#option-list").empty().append(
            data.payload.sort((a, b) => {
                if (a.sequence === b.sequence) {
                    return 0;
                }

                return (a.sequence < b.sequence) ? -1 : 1;
            }).map((questionOption) => {
                return $("<p>")
                    .data("questionOption", questionOption)
                    .html(` ID: ${questionOption._id} <a class="question-option-delete">Delete</a><br>
                            Content: <span class="question-option-content">${questionOption.content}</span> <a class="question-option-content-edit">Edit</a><br>
                            Sequence: ${questionOption.sequence} <a class="question-option-up">Up</a> <a class="question-option-down">Down</a> `);
            })
        );

        return data;
    }

    private readonly loadAndRenderQuestionOptions = () => {
        return this.loadQuestionOptionData()
            .then(_ => this.cullBadData(_))
            .then(this.renderQuestionOptions)
    }

    private readonly setupForm = () => {
        this.setupCreateButton();
        this.setupEditActionLink();
        this.setupDeleteActionLink();
        this.setupMoveUpActionLink();
        this.setupMoveDownActionLink();
    }

    private readonly setupCreateButton = () => {
        this.$("#create-question-option").on("click", (e) => {
            const $elem = $(e.currentTarget);

            // Hide button while form open
            $elem.hide();

            const lastQuestionOptionData: ToClientData.QuestionOption | undefined = this.$("#question-options").children().last().data("questionOption");

            const $contentField = $("<span>").addClass("question-option-content").text("<Type question option here>").prop("contenteditable", true).css("outline", "1px solid orange");
            const $insertionForm = $("<p>")
                .append([
                    "Content: ",
                    $contentField,
                    $("<a>").text("Save").one("click", () => {
                        this.ajaxFuncs!.post<IMoocchatApi.ToClientResponseBase<IMoocchatApi.ToClientInsertionIdResponse>>
                            (`/api/admin/question/${this.questionId}/option`, {
                                content: $contentField.html(),
                                sequence: lastQuestionOptionData ? lastQuestionOptionData.sequence + 1 : 0,
                            }).promise
                            .then(_ => this.cullBadData(_))
                            .then(() => {
                                return this.loadAndRenderQuestionOptions()
                                    .then(() => {
                                        $insertionForm.remove();
                                        $elem.show();
                                    });
                            })
                            .catch((error) => {
                                this.dispatchError(error);
                            });
                    }),
                    " ",
                    $("<a>").text("Cancel").one("click", () => {
                        $elem.show().prev().remove();
                    }),
                ])

            $elem.before($insertionForm);
        });
    }

    private readonly setupEditActionLink = () => {
        this.$().on("click", "a.question-option-content-edit", (e) => {
            const $elem = $(e.currentTarget);
            const $contentElem = $elem.siblings(".question-option-content");

            // Make content field editable
            const originalHtml = $contentElem.html();
            $contentElem.prop("contenteditable", true).css("outline", "1px solid orange");

            const currentData: ToClientData.QuestionOption = $elem.parent().data("questionOption");

            $elem.hide().after(
                $("<span>").append([
                    $("<a>").text("Save").one("click", () => {
                        this.ajaxFuncs!.put<IMoocchatApi.ToClientResponseBase<void>>
                            (`/api/admin/question/${this.questionId}/option/${currentData._id}`, {
                                content: $contentElem.html(),
                            }).promise
                            .then(_ => this.cullBadData(_))
                            .then(this.loadAndRenderQuestionOptions)
                            .catch((error) => {
                                this.dispatchError(error);
                            });
                    }),
                    " ",
                    $("<a>").text("Cancel").one("click", () => {
                        $contentElem.prop("contenteditable", false).css("outline", "").html(originalHtml);
                        $elem.show().next().remove();
                    }),
                ])
            );


        });
    }

    private readonly setupDeleteActionLink = () => {
        this.$().on("click", "a.question-option-delete", (e) => {
            e.preventDefault();

            const $questionOptionElem = $(e.currentTarget).parent();

            const currentData: ToClientData.QuestionOption = $questionOptionElem.data("questionOption");

            this.ajaxFuncs!.delete<IMoocchatApi.ToClientResponseBase<void>>
                (`/api/admin/question/${this.questionId}/option/${currentData._id}`).promise
                .then(_ => this.cullBadData(_))
                .then(this.loadAndRenderQuestionOptions)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly setupMoveUpActionLink = () => {
        this.$().on("click", "a.question-option-up", (e) => {
            e.preventDefault();

            const $questionOptionElem = $(e.currentTarget).parent();

            // Swap with one above
            const $questionOptionElemAbove = $questionOptionElem.prev();

            // Stop if no element above
            if ($questionOptionElemAbove.length === 0) {
                return;
            }

            const currentData: ToClientData.QuestionOption = $questionOptionElem.data("questionOption");
            const aboveData: ToClientData.QuestionOption = $questionOptionElemAbove.data("questionOption");

            Promise.all([
                this.ajaxFuncs!.put<IMoocchatApi.ToClientResponseBase<void>>
                    (`/api/admin/question/${this.questionId}/option/${currentData._id}`, {
                        sequence: aboveData.sequence,
                    }).promise
                    .then(_ => this.cullBadData(_)),

                this.ajaxFuncs!.put<IMoocchatApi.ToClientResponseBase<void>>
                    (`/api/admin/question/${this.questionId}/option/${aboveData._id}`, {
                        sequence: currentData.sequence,
                    }).promise
                    .then(_ => this.cullBadData(_)),
            ])
                .then(() => {
                    return this.loadAndRenderQuestionOptions();
                })
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly setupMoveDownActionLink = () => {
        this.$().on("click", "a.question-option-down", (e) => {
            e.preventDefault();

            const $questionOptionElem = $(e.currentTarget).parent();

            // Swap with one above
            const $questionOptionElemBelow = $questionOptionElem.next();

            // Stop if no element below
            if ($questionOptionElemBelow.length === 0) {
                return;
            }

            const currentData: ToClientData.QuestionOption = $questionOptionElem.data("questionOption");
            const belowData: ToClientData.QuestionOption = $questionOptionElemBelow.data("questionOption");

            Promise.all([
                this.ajaxFuncs!.put<IMoocchatApi.ToClientResponseBase<void>>
                    (`/api/admin/question/${this.questionId}/option/${currentData._id}`, {
                        sequence: belowData.sequence,
                    }).promise
                    .then(_ => this.cullBadData(_)),

                this.ajaxFuncs!.put<IMoocchatApi.ToClientResponseBase<void>>
                    (`/api/admin/question/${this.questionId}/option/${belowData._id}`, {
                        sequence: currentData.sequence,
                    }).promise
                    .then(_ => this.cullBadData(_)),
            ])
                .then(() => {
                    return this.loadAndRenderQuestionOptions();
                })
                .catch((error) => {
                    this.dispatchError(error);
                });

        });
    }
}