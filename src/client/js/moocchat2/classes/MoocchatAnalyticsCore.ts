import {IMoocchatAnalytics_TrackEvent} from "./IMoocchatAnalytics";

/**
 * MOOCchat
 * AnalyticsCore class module
 * 
 * This is used to represent the public methods for the analytics class,
 * and can be used to represent a MoocchatAnalytics object when analytics is turned off. 
 */
export class MoocchatAnalyticsCore {
    public trackEvent(category: string, action: string, name?: string, value?: number) { }
    public listenAndForwardEvent<EventData>(eventName: string, func: (data: EventData) => IMoocchatAnalytics_TrackEvent) { }
}
