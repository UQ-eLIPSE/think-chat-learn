import { XHRStore } from "../../../js/xhr/XHRStore";

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
            new Layout("admin-quiz-schedule-edit-layout", this.getLayoutData())
                .wipeThenAppendTo(this.getRenderTarget())
                .promise
                .then(this.showRelevantElements)
                .then(this.renderQuizScheduleInfo)
                .then(this.enableDatePicker)
                .then(this.setupForm)
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

    private readonly setupForm = () => {
        this.section$("#save-changes").one("click", () => {
            // const questionId: string = this.section$("#question-id").val();
            const questionId: string = this.section$("#question-title").text();

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
                .then(() => {
                    // Load updated item in parent
                    this.loadQuizScheduleIdInParent(this.quizSchedule!._id!);
                })
                .catch((error) => {
                    this.dispatchError(error);
                });
        });

        this.section$("#delete").one("click", () => {
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
                .then(this.reloadQuizSchedulesInParent)
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
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
        this.section$("#question-title").text(this.quizSchedule!.questionId || "");
        this.section$("#available-start").val(new Date(this.quizSchedule!.availableStart || 0).toISOString());
        this.section$("#available-end").val(new Date(this.quizSchedule!.availableEnd || 0).toISOString());
    }
}

// function dateToRfc3339Local(date: Date, includeMilliseconds: boolean = false) {
//     const yyyy = date.getFullYear();
//     const MM = date.getMonth() + 1;
//     const dd = date.getDate();

//     const HH = date.getHours();
//     const mm = date.getMinutes();
//     const ss = date.getSeconds();
//     const ms = date.getMilliseconds();

//     return `${yyyy}-${MM < 10 ? "0" + MM : MM}-${dd < 10 ? "0" + dd : dd}T${HH < 10 ? "0" + HH : HH}:${mm < 10 ? "0" + mm : mm}:${ss < 10 ? "0" + ss : ss}.${includeMilliseconds ? ms : 0}`
// }

// function rfc3339LocalToDate(datetime: string) {
//     const dateTimeSplit = datetime.split("T");

//     const yyyyMMdd = dateTimeSplit[0].split("-");
//     const yyyy = +yyyyMMdd[0];
//     const MM = +yyyyMMdd[1];
//     const dd = +yyyyMMdd[2];

//     const HHmmss_ms = dateTimeSplit[1].split(":");
//     const HH = +HHmmss_ms[0];
//     const mm = +HHmmss_ms[1];
//     const ss_ms = (HHmmss_ms[2] || "").split(".");
//     const ss = +ss_ms[0] || 0;
//     const ms = +ss_ms[1] || 0;

//     const date = new Date();

//     date.setFullYear(yyyy);
//     date.setMonth(MM - 1);
//     date.setDate(dd);

//     date.setHours(HH);
//     date.setMinutes(mm);
//     date.setSeconds(ss);
//     date.setMilliseconds(ms);

//     return date;
// }