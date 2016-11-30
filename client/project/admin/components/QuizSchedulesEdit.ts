import { XHRStore } from "../../../js/xhr/XHRStore";

import * as PromiseError from "../../../../common/js/error/PromiseError";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";

import * as IMoocchatApi from "../../../../common/interfaces/IMoocchatApi";
import * as ToClientData from "../../../../common/interfaces/ToClientData";

export class QuizSchedulesEdit extends ComponentRenderable {
    private ajaxFuncs: AjaxFuncFactoryResultCollection | undefined;
    private quizSchedule: ToClientData.QuizSchedule | undefined;

    private readonly xhrStore = new XHRStore();

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc((quizSchedule: ToClientData.QuizSchedule) => {
            this.fetchAjaxFuncs();
            this.quizSchedule = quizSchedule;
        });

        this.setDestroyFunc(() => {
            this.ajaxFuncs = undefined;
            this.quizSchedule = undefined;
        });

        this.setRenderFunc(() => {
            return new Layout("admin-quiz-schedule-edit-layout", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.showRelevantElements)
                .then(this.renderQuizScheduleInfo)
                .then(this.enableDatePicker)
                .then(this.setupForm)
                .then(this.setupQuestionLink)
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
        this.section$(".create-only").hide();
        this.section$(".edit-only").show();
    }

    private readonly setupQuestionLink = () => {
        this.section$("#view-question").on("click", () => {
            const questionId = this.quizSchedule!.questionId;

            if (!questionId) {
                return;
            }

            // Ask parents up the chain to open view for requested question
            this.dispatch("view-question", questionId, true);
        });
    }

    private readonly setupForm = () => {
        const $saveButton = this.section$("#save-changes");
        const $deleteButton = this.section$("#delete");

        const onSaveButtonClick = () => {
            const questionId: string = this.quizSchedule!.questionId!;

            const flatpickrAvailableStart: Flatpickr = this.section$("#available-start").data("flatpickr");
            const flatpickrAvailableEnd: Flatpickr = this.section$("#available-end").data("flatpickr");

            const availableStart: string = flatpickrAvailableStart.selectedDates[0].toISOString();
            const availableEnd: string = flatpickrAvailableEnd.selectedDates[0].toISOString();

            const xhrCall = this.ajaxFuncs!.put<IMoocchatApi.ToClientResponseBase<void>>
                (`/api/admin/quiz/${this.quizSchedule!._id}`, {
                    questionId,
                    availableStart,
                    availableEnd,
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
                    this.loadQuizScheduleIdInParent(this.quizSchedule!._id!);
                })
                .catch((err) => {
                    PromiseError.AbortChainError.ContinueAbort(err);

                    this.dispatchError(err);
                });
        }

        const onDeleteButtonClick = () => {
            const xhrCall = this.ajaxFuncs!.delete<IMoocchatApi.ToClientResponseBase<void>>
                (`/api/admin/quiz/${this.quizSchedule!._id}`);

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
                .then(this.reloadQuizSchedulesInParent)
                .catch((err) => {
                    PromiseError.AbortChainError.ContinueAbort(err);

                    this.dispatchError(err);
                });
        }

        $saveButton.on("click", onSaveButtonClick);
        $deleteButton.on("click", onDeleteButtonClick);
    }

    private readonly enableDatePicker = () => {
        const $elems = [
            this.section$("#available-start"),
            this.section$("#available-end"),
        ];

        const config: FlatpickrOptions = {
            enableTime: true,
        };

        // Save reference to flatpickr instance to the element itself
        $elems.forEach(($elem) => {
            $elem.data("flatpickr", new Flatpickr($elem.get(0), config));
        });
    }

    private readonly loadQuizScheduleIdInParent = (id: string) => {
        const parent = this.getParent();

        if (!parent) {
            throw new Error("No parent");
        }

        this.dispatch("reload-list-edit-id", id, true);
    }

    private readonly reloadQuizSchedulesInParent = () => {
        const parent = this.getParent();

        if (!parent) {
            throw new Error("No parent");
        }

        this.dispatch("reload-list-reset", undefined, true);
    }

    private readonly renderQuizScheduleInfo = () => {
        this.section$("#id").text(this.quizSchedule!._id || "?");
        this.section$("#available-start").val(new Date(this.quizSchedule!.availableStart || 0).toISOString());
        this.section$("#available-end").val(new Date(this.quizSchedule!.availableEnd || 0).toISOString());
    }
}
