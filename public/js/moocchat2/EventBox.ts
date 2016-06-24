
export type EventBoxCallback = (data: any) => void;

/**
 * MOOCchat
 * EventBox class module
 * 
 * Provides a basic event system that doesn't rely on DOM events
 */

export class EventBox {
    private eventCallbacks: { [eventName: string]: EventBoxCallback[] } = {};
    private dispatchedEvents: {[eventName: string]: any} = {};

    /**
     * @param {string} eventName
     * @param {EventBoxCallback} callback
     * @param {boolean} runCallbackOnBindIfDispatched Run callback when bound to an event, if event has already previously occurred. Default: `true`.
     */
    public on(eventName: string, callback: EventBoxCallback, runCallbackOnBindIfDispatched: boolean = true) {
        let registeredCallbacks = this.eventCallbacks[eventName];

        if (!registeredCallbacks) {
            this.eventCallbacks[eventName] = [];
        }

        this.eventCallbacks[eventName].push(callback);

        if (runCallbackOnBindIfDispatched && this.hasEventBeenDispatched(eventName)) {
            // This must be in a traditional function(){} block
            // so that scope is limited to global/window
            (function(callback: EventBoxCallback, data: any) {
                callback(data);
            })(callback, this.dispatchedEvents[eventName]);
        }
    }

    public off(eventName: string, callback?: EventBoxCallback) {
        let registeredCallbacks = this.eventCallbacks[eventName];

        if (!registeredCallbacks) {
            return;
        }

        if (callback) {
            let index = registeredCallbacks.indexOf(callback);

            if (index < 0) {
                return;
            }

            registeredCallbacks.splice(index, 1);
            return;
        }

        delete this.eventCallbacks[eventName];
    }

    public dispatch(eventName: string, data?: any) {
        // Even if data is undefined, the key will still make it into Object
        this.dispatchedEvents[eventName] = data;
        this.runCallbacks(eventName, data);
    }

    private runCallbacks(eventName: string, data?: any) {
        let callbacks = this.eventCallbacks[eventName];

        if (callbacks) {
            // This must be in a traditional function(){} block
            // so that scope is limited to global/window
            callbacks.forEach(function(callback) {
                callback(data);
            });
        }
    }

    private hasEventBeenDispatched(eventName: string) {
        return (Object.keys(this.dispatchedEvents).indexOf(eventName) > -1);
    }
}