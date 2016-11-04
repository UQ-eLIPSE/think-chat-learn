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

            this.emptyList();
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
            Promise.all([
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

        $list.on("click", "li", (e) => {
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
        const xhrCall = this.ajaxFuncs!.get<IMoocchatApi.ToClientResponseBase<IDB_QuizSchedule[]>>
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

    private readonly cullBadData = <T>(data: IMoocchatApi.ToClientResponseBase<T>) => {
        if (!data.success) {
            throw data.message;
        }

        return data;
    }

    private readonly renderQuizScheduleList = (data: IMoocchatApi.ToClientResponseSuccess<IDB_QuizSchedule[]>) => {
        const $list = this.section$("#quiz-schedule-list");

        const questionMapPromise = this.loadQuestionData()
            .then(_ => this.cullBadData(_))
            .then((data) => {
                const questionMap = new KVStore<IDB_Question>();
                data.payload.forEach(question => questionMap.put(question._id!, question));
                return questionMap;
            })
            .catch((error) => {
                this.dispatchError(error);
            });

        const $quizScheduleListElems = data.payload.map((quizSchedule) => {
            const startDate = new Date(quizSchedule.availableStart!);
            const endDate = new Date(quizSchedule.availableEnd!);

            const $li = $("<li>")
                .addClass("quiz-schedule-item")
                .data("quizSchedule", quizSchedule)
                .html(` <div class="table">
                            <div class="row">
                                <div class="info-left">
                                    <div class="question-title">...</div>
                                </div>
                                <div class="info-right">
                                    <div class="date">${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}<br>${startDate.getHours()}:${startDate.getMinutes()}</div>
                                    <div class="date">${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}<br>${endDate.getHours()}:${endDate.getMinutes()}</div>
                                </div>
                            </div>
                        </div> `);

            // Fill in title when we have question data
            questionMapPromise
                .then((questionMap) => {
                    const question = questionMap.get(quizSchedule.questionId!);
                    $(".question-title", $li).text(question!.title!);
                });

            return $li;
        });

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

            case "edit": {  // @param data {IDB_QuizSchedule} 
                const quizSchedule: IDB_QuizSchedule = data;

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

interface IDB_QuizSchedule {
    _id?: string;
    questionId?: string;
    course?: string;
    availableStart?: string;
    availableEnd?: string;
    blackboardColumnId?: number;
}

interface IDB_Question {
    _id?: string,
    title?: string,
    content?: string,
    course?: string,
}