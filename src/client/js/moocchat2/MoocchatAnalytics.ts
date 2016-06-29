import {MoocchatSession} from "./MoocchatSession";
import {PageManager_Events, IPageManager_PageLoad} from "./PageManager";
import {MoocchatUser_Events, IMoocchatUser_LoginSuccess} from "./MoocchatUser";

declare const _paq: any[];        // Piwik _paq
// declare const Piwik: any;         // Piwik tracker object

interface IMoocchatAnalytics_TrackEvent {
    category: string,
    action: string,
    name?: string,
    value?: number
}

/**
 * MOOCchat
 * Analytics class module
 * 
 * Analytics between client and Piwik.
 */
export class MoocchatAnalytics {
    private session: MoocchatSession<any>;

    constructor(session: MoocchatSession<any>) {
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
            let result = func(data);
            this.trackEvent(result.category, result.action, result.name, result.value);
        })
    }

    // Piwik tracking events are written as instance functions rather than prototyped ones
    // so that references to this are preserved correctly
    private trackPageView = (data: IPageManager_PageLoad) => {
        _paq.push(["setDocumentTitle", data.name]);
        _paq.push(["setCustomUrl", "/internal_page/"+data.name]);
        _paq.push(["setGenerationTimeMs", data.loadTimeMs]);    // Generation time now reflects the load time of the page
        _paq.push(["trackPageView", data.name]);
    }

    private setUserId = (data: IMoocchatUser_LoginSuccess) => {
        _paq.push(["setUserId", data.username]);
    }



    // Attach handlers
    private setup() {
        this.setupHeartBeatTimer();
        this.setupTrackPageView();
        this.setupSetUserId();
    }

    private setupHeartBeatTimer() {
        // Have page view time analytics to a 5 second granularity
        _paq.push(["enableHeartBeatTimer", 5]);
    }

    private setupTrackPageView() {
        this.session.eventManager.on(PageManager_Events.PAGE_LOAD, this.trackPageView);
    }

    private setupSetUserId() {
        this.session.eventManager.on(MoocchatUser_Events.LOGIN_SUCCESS, this.setUserId);
    }


}
