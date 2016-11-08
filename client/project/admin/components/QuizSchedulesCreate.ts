import { Promise } from "es6-promise";

import { XHRStore } from "../../../js/xhr/XHRStore";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";

import * as IMoocchatApi from "../../../../common/interfaces/IMoocchatApi";

export class QuizSchedulesCreate extends ComponentRenderable {
    private ajaxFuncs: AjaxFuncFactoryResultCollection | undefined;

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
            Promise.all([
                this.loadQuestions(),
                new Layout("admin-quiz-schedule-edit-layout", this.getLayoutData())
                    .wipeThenAppendTo(this.getRenderTarget())
                    .promise
                    .then(this.showRelevantElements)
                    .then(this.setupForm)
            ])
                .then(([questionData]) => this.cullBadData(questionData))
                .then((questionData) => {
                    this.fillQuestionDropdown(questionData);
                })
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

    private readonly loadQuestions = () => {
        const xhrCall = this.ajaxFuncs!.get<IMoocchatApi.ToClientResponseBase<IDB_Question[]>>
            (`/api/admin/question`);

        // Store in XHR store to permit aborting when necessary
        const xhrObj = xhrCall.xhr;
        const xhrId = this.xhrStore.add(xhrObj);

        // Remove once complete
        xhrCall.promise.then(() => {
            this.xhrStore.remove(xhrId);
        });

        return xhrCall.promise;
    }

    private readonly showRelevantElements = () => {
        this.section$(".create-only").show();
        this.section$(".edit-only").hide();
    }

    private readonly setupForm = () => {
        this.section$("#create").one("click", () => {
            const questionId: string = this.section$("#question-id").val();
            const availableStart: string = rfc3339LocalToDate(this.section$("#available-start").val()).toISOString();
            const availableEnd: string = rfc3339LocalToDate(this.section$("#available-end").val()).toISOString();
            // const blackboardColumnId: string = this.section$("#blackboard-column-id").val();
            const blackboardColumnId: string = "";

            const xhrCall = this.ajaxFuncs!.post<IMoocchatApi.ToClientResponseBase<IMoocchatApi.ToClientInsertionIdResponse>>
                (`/api/admin/quiz`, {
                    questionId,
                    availableStart,
                    availableEnd,
                    blackboardColumnId,
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
                    this.loadQuizScheduleIdInParent(data.payload.id);
                })
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly loadQuizScheduleIdInParent = (id: string) => {
        const parent = this.getParent();

        if (!parent) {
            throw new Error("No parent");
        }

        this.dispatch("reload-list-edit-id", id, true);
    }

    private readonly fillQuestionDropdown = (data: IMoocchatApi.ToClientResponseSuccess<IDB_Question[]>) => {
        const $dropdown = this.section$("#question-id");

        const $dropdownOptionElems = data.payload.map((question) => {
            return $("<option>")
                .prop({
                    value: question._id,
                })
                .text(`${(question.title && question.title.substr(0, 100)) || "[Undefined Title]"} (${question._id})`);
        });

        $dropdown.empty().append($dropdownOptionElems);
    }
}

interface IDB_Question {
    _id?: string,
    title?: string,
    content?: string,
    course?: string,
}

function rfc3339LocalToDate(datetime: string) {
    const dateTimeSplit = datetime.split("T");

    const yyyyMMdd = dateTimeSplit[0].split("-");
    const yyyy = +yyyyMMdd[0];
    const MM = +yyyyMMdd[1];
    const dd = +yyyyMMdd[2];

    const HHmmss_ms = dateTimeSplit[1].split(":");
    const HH = +HHmmss_ms[0];
    const mm = +HHmmss_ms[1];
    const ss_ms = (HHmmss_ms[2] || "").split(".");
    const ss = +ss_ms[0] || 0;
    const ms = +ss_ms[1] || 0;

    const date = new Date();

    date.setFullYear(yyyy);
    date.setMonth(MM - 1);
    date.setDate(dd);

    date.setHours(HH);
    date.setMinutes(mm);
    date.setSeconds(ss);
    date.setMilliseconds(ms);

    return date;
}