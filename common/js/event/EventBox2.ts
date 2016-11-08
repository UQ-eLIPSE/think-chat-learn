import { KVStore } from "../KVStore";

/**
 * Basic event system that doesn't use DOM events.
 * 
 * Bubbling is supported (parent EventBox must be supplied in constructor.)
 * 
 * 
 * @export
 * @class EventBox2
 */
export class EventBox2 {
    private readonly parent: EventBox2 | undefined;
    private readonly callbackStore = new KVStore<EventBoxCallback[]>();

    /**
     * Creates an instance of EventBox2.
     * 
     * @param {EventBox2} parent Parent EventBox2 object if events are to be bubbled
     */
    constructor(parent?: EventBox2) {
        if (parent) {
            this.parent = parent;
        }
    }

    /**
     * Gets parent EventBox2 object.
     * 
     * @returns Parent EventBox2 object, if set
     */
    public getParent() {
        return this.parent;
    }

    /**
     * Gets callbacks associated with event.
     * 
     * @param {string} eventName
     * @returns Array of callbacks associated with event
     */
    public getCallbacks(eventName: string) {
        return this.callbackStore.get(eventName);
    }

    /**
     * Deletes all callbacks of EventBox, or all callbacks of specified event.
     * 
     * @param {string} eventName
     */
    public deleteCallbacks(eventName?: string) {
        if (!eventName) {
            this.callbackStore.empty();
            return;
        }

        this.callbackStore.delete(eventName);
    }

    /**
     * Attaches an event callback.
     * 
     * @param {string} eventName
     * @param {EventBoxCallback} callback
     */
    public on(eventName: string, callback: EventBoxCallback) {
        let callbacksForEvent = this.getCallbacks(eventName);

        if (!callbacksForEvent) {
            callbacksForEvent = [];
            this.callbackStore.put(eventName, callbacksForEvent);
        }

        callbacksForEvent.push(callback);
    }

    public once(eventName: string, callback: EventBoxCallback) {
        // A new callback is created that does the removal of the specified
        //   callback plus itself
        const offCallback = () => {
            this.off(eventName, callback);
            this.off(eventName, offCallback);
        };

        this.on(eventName, callback);
        this.on(eventName, offCallback);
    }

    /**
     * Detaches event callbacks or just a specified callback.
     * 
     * @param {string} eventName
     * @param {EventBoxCallback} callback
     */
    public off(eventName: string, callback?: EventBoxCallback) {
        const callbacksForEvent = this.getCallbacks(eventName);

        if (!callbacksForEvent) {
            return;
        }

        // Remove only specified callback where available
        if (callback) {
            const index = callbacksForEvent.indexOf(callback);

            if (index < 0) {
                return;
            }

            callbacksForEvent.splice(index, 1);
            return;
        }

        // If no callback specified, delete all associated with event
        this.deleteCallbacks(eventName);
    }

    /**
     * Triggers an event, and runs all callbacks.
     * 
     * @param {string} eventName
     * @param {*} data Data to be passed to callbacks
     * @param {number} bubbleLevels Number of parent EventBoxes to bubble up through; 0 will always dispatch within the originating EventBox first; default = Infinity  
     * @param {boolean} immediate Whether execution should be immediate or at end of JS queue; default = true
     */
    public dispatch(eventName: string, data?: any, bubbleLevels: number = Infinity, immediate: boolean = true) {
        let callbacks = this.getCallbacks(eventName);

        // Make callbacks a blank array
        // We don't stop the dispatch here as we may need to bubble up
        if (!callbacks) {
            callbacks = [];
        }

        // Create a dispatch function that will be executed
        const parent = this.getParent();

        const dispatchFunc = function() {
            let stopPropagation = false;

            // Run through all callbacks at this level, if any one of them
            //   returns `false`, then we shall halt propagation to the parent
            //   EventBox below
            callbacks!.forEach(function(callback) {
                stopPropagation = (callback(data) === false) && stopPropagation;
            });

            // Dispatch to parent to bubble events
            if (parent && !stopPropagation && bubbleLevels > 0) {
                parent.dispatch(eventName, data, bubbleLevels - 1, immediate);
            }
        }

        // Execution of dispatch function
        if (immediate) {
            dispatchFunc();
        } else {
            // setTimeout(..., 0) pushes execution to end of queue
            // Note browsers may delay execution of this line beyond execution
            //   immediately after end of queue (up to ~10ms)
            setTimeout(dispatchFunc, 0);
        }
    }

    /**
     * Destroys events and callbacks in EventBox instance. 
     */
    public destroy() {
        this.callbackStore.empty();
    }
}

export type EventBoxCallback = (data?: any) => void | boolean;
