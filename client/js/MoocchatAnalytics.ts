import {MoocchatSession} from "./MoocchatSession";
import {PageManager_Events} from "./PageManager";
import {IPageManager_PageLoad} from "../../common/interfaces/IPageManager";
import {MoocchatUser_Events} from "./MoocchatUser";
import {IMoocchatUser_LoginSuccess} from "../../common/interfaces/IMoocchatUser";

import {MoocchatAnalyticsCore} from "./MoocchatAnalyticsCore";
import {IMoocchatAnalytics_TrackEvent} from "../../common/interfaces/IMoocchatAnalytics";

declare const _paq: any[];        // Piwik _paq is global

/**
 * MOOCchat
 * Analytics class module
 * 
 * Analytics between client and Piwik.
 */
export class MoocchatAnalytics extends MoocchatAnalyticsCore {
    private session: MoocchatSession<any>;

    constructor(session: MoocchatSession<any>) {
        super();
        this.session = session;
        this.setup();
    }

    /**
     * Sends "trackEvent" to Piwik.
     */
    public trackEvent(category: string, action: string, name?: string, value?: number) {
        _paq.push(["trackEvent", category, action, name, value]);
    }

    /**
     * Attaches to session event manager and listens to event to occur and sends track event to Piwik.  
     */
    public listenAndForwardEvent<EventData>(eventName: string, func: (data: EventData) => IMoocchatAnalytics_TrackEvent) {
        this.session.eventManager.on(eventName, (data: EventData) => {
            const result = func(data);
            this.trackEvent(result.category, result.action, result.name, result.value);
        })
    }

    /**
     * Processes page load data and pushes page view event to Piwik.
     */
    private trackPageView(data: IPageManager_PageLoad) {
        _paq.push(["setDocumentTitle", `Page ${data.name}`]);
        _paq.push(["setCustomUrl", "/internal_page/" + data.name]);
        _paq.push(["setGenerationTimeMs", data.loadTimeMs]);    // Generation time reflects the load time of the page
        _paq.push(["trackPageView", data.name]);
    }

    /**
     * Sets Piwik session user ID with login data.
     */
    private setUserId(data: IMoocchatUser_LoginSuccess) {
        _paq.push(["setUserId", data.username]);
    }

    /**
     * Attaches handlers and sets up session analytics.
     */
    private setup() {
        // Temporarily disabling heartbeat timer due to excessive traffic
        // this.setupHeartBeatTimer();
        this.setupTrackPageView();
        this.setupSetUserId();
    }

    // private setupHeartBeatTimer() {
    //     // Have page view time analytics to a 5 second granularity
    //     _paq.push(["enableHeartBeatTimer", 5]);
    // }

    private setupTrackPageView() {
        this.session.eventManager.on(PageManager_Events.PAGE_LOAD, this.trackPageView);
    }

    private setupSetUserId() {
        this.session.eventManager.on(MoocchatUser_Events.LOGIN_SUCCESS, this.setUserId);
    }
}
