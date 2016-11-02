import * as $ from "jquery";

import { KVStore } from "../../../../common/js/KVStore";

import { Component } from "../../../js/ui/Component";
import { ComponentRenderable } from "../../../js/ui/ComponentRenderable";

import { Layout } from "../../../js/ui/Layout";
import { LayoutData } from "../../../js/ui/LayoutData";

import { Home } from "./Home";
import { Marking } from "./Marking";
import { System } from "./System";

import * as IMoocchatApi from "../../../../common/interfaces/IMoocchatApi";
import { ILTIData } from "../../../../common/interfaces/ILTIData";
import { AuthDataWrapperLTI } from "../../../js/auth/AuthDataWrapperLTI";

// LTI data should be inserted on the page during LTI handover
declare const _LTI_BASIC_LAUNCH_DATA: ILTIData | undefined;

export class AdminPanel extends Component {
    private readonly layoutData: LayoutData;
    private readonly contentElem: JQuery;
    private readonly lti: AuthDataWrapperLTI;

    private readonly components = new KVStore<Component>();

    private sessionId: string | undefined;

    constructor(layoutDataUrl: string, contentElem: JQuery) {
        super();
        this.layoutData = new LayoutData(layoutDataUrl);
        this.contentElem = contentElem;

        this.setupErrorListener();

        try {
            this.lti = new AuthDataWrapperLTI(_LTI_BASIC_LAUNCH_DATA);
        } catch (e) {
            this.dispatchError(e);
            return;
        }

        this.setupSubcomponents();
        this.setupLeftBarLinks();
        this.setupComponentAjaxFunctionFactory();
        this.setupSetSectionActive();

        this.setInitFunc(() => {
            this.loginLti()
                .then(() => {
                    this.processAction("home");
                })
                .catch((error: any) => {
                    this.dispatchError(error);
                });
        });
    }

    private setupSubcomponents() {
        this.components.put("home", new Home(this.contentElem, this.layoutData, this));
        this.components.put("marking", new Marking(this.contentElem, this.layoutData, this));
        this.components.put("system", new System(this.contentElem, this.layoutData, this));
    }

    private setupLeftBarLinks() {
        $("#task-sections").on("click", "a", (e) => {
            const $linkElem = $(e.target);
            this.processAction($linkElem.data("action"));
        });
    }

    private ajaxFactoryWithoutData(method: "GET" | "DELETE", includeSession: boolean = true) {
        return <T>(url: string) => {
            const headers: { [header: string]: string | undefined } = {};

            if (includeSession) {
                headers["Moocchat-Session-Id"] = this.sessionId;
            }

            const xhr = $.ajax({
                method,
                url,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                headers,
            });

            const promise = new Promise<T>((resolve, reject) => {
                xhr
                    .done((data: T) => {
                        resolve(data);
                    })
                    .fail(reject);
            });

            return {
                promise,
                xhr,
            }
        }
    }

    private ajaxFactoryWithData(method: "POST" | "PUT", includeSession: boolean = true) {
        return <T>(url: string, data: { [key: string]: string | number | undefined } | string) => {
            const headers: { [header: string]: string | undefined } = {};

            if (includeSession) {
                headers["Moocchat-Session-Id"] = this.sessionId;
            }

            if (typeof data !== "string") {
                data = JSON.stringify(data);
            }

            const xhr = $.ajax({
                method,
                url,
                contentType: "application/json; charset=utf-8",
                data,
                dataType: "json",
                headers,
            });

            const promise = new Promise<T>((resolve, reject) => {
                xhr
                    .done((data: T) => {
                        resolve(data);
                    })
                    .fail(reject);
            });

            return {
                promise,
                xhr,
            }
        }
    }

    /**
     * This sets up a way for child components to run AJAX calls, by having
     *   them specifically request the AJAX methods, in order to generate
     *   the appropriate methods with the session IDs in them without
     *   needing to know about the session information.
     * 
     * @private
     */
    private setupComponentAjaxFunctionFactory() {
        this.on("ajaxFuncFactoryRequest", (data: any) => {
            const originComponent: Component = data.originComponent;
            const factory = this.generateAjaxFuncFactory();

            originComponent.dispatch("ajaxFuncFactoryGenerated", factory);

            // Stop propagation
            return false;
        });
    }

    public generateAjaxFuncFactory(): AjaxFuncFactory {
        return (includeSession: boolean = true) => {
            return {
                get: this.ajaxFactoryWithoutData("GET", includeSession),
                post: this.ajaxFactoryWithData("POST", includeSession),
                delete: this.ajaxFactoryWithoutData("DELETE", includeSession),
                put: this.ajaxFactoryWithData("PUT", includeSession),
            }
        };
    }

    /**
     * 
     * 
     * @private
     */
    private setupSetSectionActive() {
        this.on("setSectionActive", (section?: string) => {
            // We permit the data to be blank in case we want to unset active flags
            $("#task-sections li.active").removeClass("active");

            if (section) {
                $(`#task-sections li[data-section="${section}"]`).addClass("active");
            }

            // Stop propagation
            return false;
        })
    }

    private loginLti() {
        //Wipe session ID
        this.sessionId = undefined;

        // Show log in interstitial
        const logInInterstitial = new Layout("logging-in", this.layoutData).appendTo(this.contentElem);
        logInInterstitial.promise.catch((error: any) => {
            this.dispatchError(error);
        });

        // Request login with session ID
        return this.ajaxFactoryWithData("POST", false)
            <IMoocchatApi.ToClientResponseBase<IMoocchatApi.ToClientLoginResponsePayload>>(`/api/session/lti`, this.lti.stringify()).promise
            .then((data) => {
                if (!data.success) { throw data.message; }

                return this.sessionId = data.payload.sessionId;
            })
            .then(() => {
                // Check admin test
                return this.ajaxFactoryWithoutData("GET")
                    <IMoocchatApi.ToClientResponseBase<void>>(`/api/admin/permissionTest`).promise;
            })
            .then((data) => {
                if (!data.success) { throw data.message; }

                // Stop log in interstitial if still loading 
                logInInterstitial.xhr.abort();

                return data.success;
            });
    }

    private renderComponent<ComponentType extends ComponentRenderable>(componentName: string) {
        const component = this.components.get<ComponentType>(componentName);

        if (!component) {
            this.dispatchError(new Error(`No component named "${componentName}"`));
            return;
        }

        component.init();
        component.render();
    }

    private processAction(action: string) {
        switch (action) {
            case "home": {
                this.renderComponent<Home>("home");
                return;
            }

            // case "quizzes":
            //     break;

            case "marking": {
                this.renderComponent<Marking>("marking");
                return;
            }

            // case "users":
            //     break;

            case "system": {
                this.renderComponent<System>("system");
                return;
            }

            case "log-out": {
                this.sessionId = undefined;
                window.location.assign(this.lti.getData().launch_presentation_return_url || "");
                return;
            }

            default: {
                const className: string = (<any>this.constructor).name || "[class]";
                this.dispatchError(new Error(`Action "${action}" is not recognised by ${className}`));
            }
        }
    }

    private setupErrorListener() {
        this.on("error", (error: any) => {
            // TODO: Do something with error
            alert(`An error occurred:
-----
${error}
-----
See console log for more info`);
            console.error(error);
        });
    }
}

export type AjaxFuncFactory = (includeSession?: boolean) => AjaxFuncFactoryResultCollection

export interface AjaxFuncFactoryResultCollection {
    get: AjaxFuncWithoutData,
    post: AjaxFuncWithData,
    delete: AjaxFuncWithoutData,
    put: AjaxFuncWithData,
}

export type AjaxFuncWithoutData = <T>(url: string) => { promise: Promise<T>, xhr: JQueryXHR };
export type AjaxFuncWithData = <T>(url: string, data: { [key: string]: string | number | undefined } | string) => { promise: Promise<T>, xhr: JQueryXHR }; 