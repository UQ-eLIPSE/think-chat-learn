import { KVStore } from "../../../../common/js/KVStore";
import { XHRStore } from "../../../js/xhr/XHRStore";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { AdminPanel, AjaxFuncFactoryResultCollection } from "./AdminPanel";

import { QuizSchedulesCreate } from "./QuizSchedulesCreate";
import { QuizSchedulesEdit } from "./QuizSchedulesEdit";

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
                .then(([quizScheduleData]) => {
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
            this.on(action, (data) => (!this.processAction(action, data)) ? false : undefined);
        }

        listenerApply("load-list");
        listenerApply("edit");
        listenerApply("edit-id");
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
    }

    private readonly setupToolbar = () => {
        const $toolbar = this.section$("> .toolbar");

        $toolbar.on("click", "li", (e) => {
            const $linkElem = $(e.target);
            this.processAction($linkElem.data("action"));
        });
    }

    private readonly setupListElemClick = () => {
        const $list = this.section$("#quiz-schedule-list");

        $list.on("click", "li", (e) => {
            const $listElem = $(e.target);

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
        new Layout("admin-quiz-schedule-sidebar-empty", this.getLayoutData())
            .wipeThenAppendTo(this.$sidebar!);
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

    private readonly renderQuizScheduleList = (data: IMoocchatApi.ToClientResponseBase<IDB_QuizSchedule[]>) => {
        if (!data.success) { throw data.message; }

        const $list = this.section$("#quiz-schedule-list");

        const $quizScheduleListElems = data.payload.map((quizSchedule) => {
            const startDate = new Date(quizSchedule.availableStart!);
            const endDate = new Date(quizSchedule.availableEnd!);

            return $("<li>")
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
        });

        this.emptyList();

        $list.append($quizScheduleListElems);
    }

    private readonly destroyActiveComponent = () => {
        this.activeComponent && this.activeComponent.destroy();
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

    private readonly processAction = (action: string, data?: any) => {
        switch (action) {
            case "reset": {
                this.emptySidebar();
                return true;
            }

            case "load-list": {
                this.loadQuizScheduleData()
                    .then(this.renderQuizScheduleList)
                    .catch((error) => {
                        this.dispatchError(error);
                    });
                return true;
            }

            case "create": {
                this.renderSidebarComponent<QuizSchedulesCreate>("create");
                return true;
            }

            case "edit": {
                this.renderSidebarComponent<QuizSchedulesEdit>("edit", data);
                return true;
            }

            case "edit-id": {
                // TODO: Convert ID to quizSchedule object
                const data = { /* quizSchedule object */ };
                this.processAction("edit", data);
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