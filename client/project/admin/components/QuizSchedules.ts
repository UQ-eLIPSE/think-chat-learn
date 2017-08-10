import { Promise } from "es6-promise";

import { KVStore } from "../../../../common/js/KVStore";
import { XHRStore } from "../../../js/xhr/XHRStore";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";

import { QuizSchedulesCreate } from "./QuizSchedulesCreate";
import { QuizSchedulesEdit } from "./QuizSchedulesEdit";
import { QuizSchedulesSidebarEmpty } from "./QuizSchedulesSidebarEmpty";

import * as IMoocchatApi from "../../../../common/interfaces/IMoocchatApi";
import * as ToClientData from "../../../../common/interfaces/ToClientData";

import { Utils } from "../../../../common/js/Utils";

export class QuizSchedules extends ComponentRenderable {
    private activeComponent: Component | undefined;

    private ajaxFuncs: AjaxFuncFactoryResultCollection | undefined;
    private readonly components = new KVStore<Component>();
    private $sidebar: JQuery | undefined;

    private readonly xhrStore = new XHRStore();

    constructor(renderTarget: JQuery, layoutData: LayoutData, parent: Component) {
        super(renderTarget, layoutData, parent);

        this.setInitFunc(() => {
            this.fetchAjaxFuncs();
            this.components.empty();
            this.xhrStore.empty();
        });

        this.setDestroyFunc(() => {
            this.destroyActiveComponent();

            this.ajaxFuncs = undefined;
            this.components.empty();

            this.xhrStore.abortAll();
            this.xhrStore.empty();

            this.emptyList();
        });

        this.setRenderFunc(() => {
            return Promise.all([
                this.loadQuizScheduleData(),
                new Layout("admin-quiz-schedule-layout", this.getLayoutData())
                    .wipeThenAppendTo(this.getRenderTarget())
                    .promise
                    .then(this.captureSidebar)
                    .then(this.setupSubcomponents)
                    .then(this.setupListeners)
                    .then(this.setupListElemClick)
                    .then(this.setupToolbar)
                    .then(this.emptySidebar),
            ])
                .then(([quizScheduleData]) => this.cullBadData(quizScheduleData))
                .then((quizScheduleData) => {
                    this.renderQuizScheduleList(quizScheduleData);
                })
                .catch((error) => {
                    this.dispatchError(error);
                });
        });
    }

    private readonly setupListeners = () => {
        const listenerApply = (action: string) => {
            // If the result of processAction is true, then we have performed
            //   an action and wish not to bubble it any further by returning
            //   `false` from the callback.
            this.on(action, (data) => (this.processAction(action, data) ? false : undefined));
        }

        listenerApply("create");
        listenerApply("load-list");
        listenerApply("edit");
        listenerApply("reload-list-reset");
        listenerApply("reload-list-edit-id");
    }

    private readonly fetchAjaxFuncs = () => {
        // Get AJAX functions from the AdminPanel which sits at the top level
        const topLevelParent = this.getTopLevelParent();

        if (!(topLevelParent instanceof AdminPanel)) {
            return this.dispatchError(new Error(`Top level parent is not AdminPanel`));
        }

        this.ajaxFuncs = topLevelParent.generateAjaxFuncFactory()();
    }

    private readonly captureSidebar = () => {
        this.$sidebar = this.section$("> .main > .sidebar");
    }

    private readonly setupSubcomponents = () => {
        const subcomponentRenderTarget = this.$sidebar;

        if (!subcomponentRenderTarget) {
            throw new Error(`No $sidebar object`);
        }

        this.components.put("create", new QuizSchedulesCreate(subcomponentRenderTarget, this.getLayoutData(), this));
        this.components.put("edit", new QuizSchedulesEdit(subcomponentRenderTarget, this.getLayoutData(), this));
        this.components.put("sidebar-empty", new QuizSchedulesSidebarEmpty(subcomponentRenderTarget, this.getLayoutData(), this));
    }

    private readonly setupToolbar = () => {
        const $toolbar = this.section$("> .toolbar");

        $toolbar.on("click", "li", (e) => {
            const $linkElem = $(e.currentTarget);
            this.processAction($linkElem.data("action"));
        });
    }

    private readonly setupListElemClick = () => {
        const $list = this.section$("#quiz-schedule-list");

        $list.on("click", "li:not(.record-indicator)", (e) => {
            const $listElem = $(e.currentTarget);

            // Fetch data which should be tied to list element
            const data = $listElem.data("quizSchedule");
            this.processAction("edit", data);
        });
    }

    private readonly emptyList = () => {
        const $list = this.section$("#quiz-schedule-list");

        $list.empty();
    }

    private readonly emptySidebar = () => {
        this.renderSidebarComponent<QuizSchedulesCreate>("sidebar-empty");
    }

    private readonly loadQuizScheduleData = () => {
        const xhrCall = this.ajaxFuncs!.get<IMoocchatApi.ToClientResponseBase<ToClientData.QuizSchedule[]>>
            (`/api/admin/quiz`);

        // Store in XHR store to permit aborting when necessary
        const xhrObj = xhrCall.xhr;
        const xhrId = this.xhrStore.add(xhrObj);

        // Remove once complete
        xhrCall.promise.then(() => {
            this.xhrStore.remove(xhrId);
        });

        return xhrCall.promise;
    }

    private readonly loadQuestionData = () => {
        const xhrCall = this.ajaxFuncs!.get<IMoocchatApi.ToClientResponseBase<ToClientData.Question[]>>
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

    private readonly cullBadData = <T>(data: IMoocchatApi.ToClientResponseBase<T>) => {
        if (!data.success) {
            throw data.message;
        }

        return data;
    }

    private readonly renderQuizScheduleList = (data: IMoocchatApi.ToClientResponseSuccess<ToClientData.QuizSchedule[]>) => {
        const $list = this.section$("#quiz-schedule-list");

        const questionMapPromise = this.loadQuestionData()
            .then(_ => this.cullBadData(_))
            .then((data) => {
                const questionMap = new KVStore<ToClientData.Question>();
                data.payload.forEach(question => questionMap.put(question._id!, question));
                return questionMap;
            })
            .catch((error) => {
                this.dispatchError(error);
            });

        const $quizScheduleListElems = data.payload.map((quizSchedule) => {
            const startDate = new Date(quizSchedule.availableStart!);
            const endDate = new Date(quizSchedule.availableEnd!);

            const padNumLeft2 = (n: number) => Utils.String.padLeft(n.toString(), "0", 2);

            const startDateStr = `${startDate.getFullYear()}-${padNumLeft2(startDate.getMonth() + 1)}-${padNumLeft2(startDate.getDate())}`;
            const startTimeStr = `${padNumLeft2(startDate.getHours())}:${padNumLeft2(startDate.getMinutes())}`;

            const endDateStr = `${endDate.getFullYear()}-${padNumLeft2(endDate.getMonth() + 1)}-${padNumLeft2(endDate.getDate())}`;
            const endTimeStr = `${padNumLeft2(endDate.getHours())}:${padNumLeft2(endDate.getMinutes())}`;

            const $li = $("<li>")
                .addClass("quiz-schedule-item")
                .data("quizSchedule", quizSchedule)
                .html(` <div class="table">
                            <div class="row">
                                <div class="info-left">
                                    <div class="question-title">...</div>
                                </div>
                                <div class="info-right">
                                    <div class="date"><span>${startDateStr}</span><br>${startTimeStr}</div>
                                    <hr>
                                    <div class="date"><span>${endDateStr}</span><br>${endTimeStr}</div>
                                </div>
                            </div>
                        </div> `);

            // Fill in title when we have question data
            questionMapPromise
                .then((questionMap) => {
                    const question = questionMap.get(quizSchedule.questionId!) || {};
                    let questionName = question.title;

                    if (questionName === undefined) {
                        questionName = "[Question not found]";
                    }

                    $(".question-title", $li).text(questionName);
                });

            return $li;
        });

        // Add record indicator at end
        $quizScheduleListElems.push(
            $("<li>")
                .addClass("record-indicator")
                .text(`${data.payload.length} scheduled quiz${data.payload.length !== 1 ? "zes" : ""}`)
        );

        this.emptyList();

        $list.append($quizScheduleListElems);

        return data;
    }

    private readonly destroyActiveComponent = () => {
        this.activeComponent && this.activeComponent.destroy();
        this.activeComponent = undefined;
    }

    private readonly renderSidebarComponent = <ComponentType extends ComponentRenderable>(componentName: string, data?: any) => {
        const component = this.components.get<ComponentType>(componentName);

        if (!component) {
            this.dispatchError(new Error(`No component named "${componentName}"`));
            return;
        }

        this.destroyActiveComponent();

        component.init(data)
            .then(() => {
                this.activeComponent = component;
                component.render();
            })
            .catch((error) => {
                this.dispatchError(error);
            });
    }

    private readonly unsetListActive = () => {
        this.section$("#quiz-schedule-list > li.active").removeClass("active");
    }

    private readonly processAction = (action: string, data?: any) => {
        switch (action) {
            case "reset": {
                this.unsetListActive();
                this.emptySidebar();
                return true;
            }

            case "load-list": {
                this.loadQuizScheduleData()
                    .then(_ => this.cullBadData(_))
                    .then(this.renderQuizScheduleList)
                    .catch((error) => {
                        this.dispatchError(error);
                    });
                return true;
            }

            case "create": {
                this.unsetListActive();
                this.renderSidebarComponent<QuizSchedulesCreate>("create");
                return true;
            }

            case "edit": {  // @param data {ToClientData.QuizSchedule} 
                const quizSchedule: ToClientData.QuizSchedule = data;

                const $elems = this.section$("#quiz-schedule-list > li");

                $elems.each((_i, e) => {
                    const $e = $(e);

                    // Highlight the one being edited
                    if ($e.data("quizSchedule") === quizSchedule) {
                        $e.addClass("active").siblings().removeClass("active");
                        return false;
                    }

                    return;
                });

                this.renderSidebarComponent<QuizSchedulesEdit>("edit", quizSchedule);
                return true;
            }

            case "reload-list-reset": {
                this.loadQuizScheduleData()
                    .then(_ => this.cullBadData(_))
                    .then(this.renderQuizScheduleList)
                    .then(this.emptySidebar)
                    .catch((error) => {
                        this.dispatchError(error);
                    });
            }

            case "reload-list-edit-id": {   // @param data {string} Quiz Schedule ID
                const id: string = data;

                this.loadQuizScheduleData()
                    .then(_ => this.cullBadData(_))
                    .then(this.renderQuizScheduleList)
                    .then((data) => {
                        for (let quizSchedule of data.payload) {
                            if (quizSchedule._id === id) {
                                this.processAction("edit", quizSchedule);
                                break;
                            }
                        }
                    })
                    .catch((error) => {
                        this.dispatchError(error);
                    });

                return true;
            }

            // default: {
            //     const className: string = (<any>this.constructor).name || "[class]";
            //     this.dispatchError(new Error(`Action "${action}" is not recognised by ${className}`));
            // }
        }

        return false;
    }
}