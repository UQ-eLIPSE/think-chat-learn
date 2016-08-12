/**
 * MOOCchat
 * EventBox class module
 * 
 * Provides a basic event system that doesn't rely on DOM events
 */
export class EventBox {
    private eventCallbacks: { [eventName: string]: EventBox_Callback[] } = {};
    private dispatchedEvents: { [eventName: string]: any } = {};

    /**
     * Attaches an event callback.
     * 
     * @param {string} eventName
     * @param {EventBoxCallback} callback
     * @param {boolean} runCallbackOnBindIfDispatched Run callback when bound to an event, if event has already previously occurred. Default: `true`.
     */
    public on(eventName: string, callback: EventBox_Callback, runCallbackOnBindIfDispatched: boolean = true) {
        const registeredCallbacks = this.eventCallbacks[eventName];

        if (!registeredCallbacks) {
            this.eventCallbacks[eventName] = [];
        }

        this.eventCallbacks[eventName].push(callback);

        if (runCallbackOnBindIfDispatched && this.hasEventBeenDispatched(eventName)) {
            // This must be in a traditional function(){} block
            // so that scope is limited to global/window
            (function(callback: EventBox_Callback, data: any) {
                callback(data);
            })(callback, this.dispatchedEvents[eventName]);
        }
    }

    /**
     * Detaches event callbacks or just a specified callback.
     * 
     * @param {string} eventName
     * @param {EventBoxCallback} callback
     */
    public off(eventName: string, callback?: EventBox_Callback) {
        const registeredCallbacks = this.eventCallbacks[eventName];

        if (!registeredCallbacks) {
            return;
        }

        if (callback) {
            const index = registeredCallbacks.indexOf(callback);

            if (index < 0) {
                return;
            }

            registeredCallbacks.splice(index, 1);
            return;
        }

        delete this.eventCallbacks[eventName];
    }

    /**
     * Triggers an event, and calls all attached callbacks.
     * 
     * @param {string} eventName
     * @param {any} data Data to be passed to callbacks
     */
    public dispatch(eventName: string, data?: any) {
        // Even if data is undefined, the key will still make it into Object
        this.dispatchedEvents[eventName] = data;
        this.runCallbacks(eventName, data);
    }

    /**
     * Destroys all references to callbacks and resets this instance.
     */
    public destroy() {
        this.eventCallbacks = {};
        this.dispatchedEvents = {};
    }

    /**
     * Run all callbacks of the event.
     * 
     * @param {string} eventName
     * @param {any} data Data to be passed to callbacks
     */
    private runCallbacks(eventName: string, data?: any) {
        const callbacks = this.eventCallbacks[eventName];

        if (callbacks) {
            // This must be in a traditional function(){} block
            // so that scope is limited to global/window
            callbacks.forEach(function(callback) {
                callback(data);
            });
        }
    }

    /**
     * Returns whether specified event has previously been dispatched.
     * 
     * @param {string} eventName
     * 
     * @return {boolean} Whether specified event has previously been dispatched
     */
    private hasEventBeenDispatched(eventName: string) {
        return (Object.keys(this.dispatchedEvents).indexOf(eventName) > -1);
    }
}

/**
 * Callback type expected for EventBox events
 */
export type EventBox_Callback = (data?: any) => any;
