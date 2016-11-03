import { Promise } from "es6-promise";

import { EventBox2, EventBoxCallback } from "../../../common/js/event/EventBox2";

/**
 * Represents a UI component with eventing system.
 * 
 * @export
 * @abstract
 * @class Component
 */
export abstract class Component {
    private readonly eventBox: EventBox2;
    private readonly parent: Component | undefined;

    private initFunc: ((data?: any) => void) | undefined;
    private destroyFunc: (() => void) | undefined;

    constructor(parent?: Component) {
        if (parent) {
            this.parent = parent;
        }

        // Hook up the EventBox to the parent if present
        this.eventBox = new EventBox2(this.parent && this.parent.eventBox);
    }

    public getParent() {
        return this.parent;
    }

    public getTopLevelParent() {
        let parent = this.parent;

        if (!parent) {
            return undefined;
        }

        while (parent.parent) {
            parent = parent.parent;
        }

        return parent;
    }

    protected setInitFunc(initFunc: () => void) {
        this.initFunc = initFunc;
    }

    protected setDestroyFunc(destroyFunc: () => void) {
        this.destroyFunc = destroyFunc;
    }

    public on(eventName: string, callback: EventBoxCallback) {
        this.eventBox.on(eventName, callback);
    }

    public once(eventName: string, callback: EventBoxCallback) {
        this.eventBox.once(eventName, callback);
    }

    public off(eventName: string, callback: EventBoxCallback) {
        // Callback is required because when component references are shared,
        //   it would be possible to accidentally kill callbacks registered by
        //   the component itself (due to the fact that the event box is
        //   also shared.)
        this.eventBox.off(eventName, callback);
    }

    /**
     * Triggers events in component.
     * 
     * Events *do not* bubble by default, as it is most likely that the parent
     *   is the one triggering events on children, so it would be meaningless
     *   to have the event passed back on itself.
     * 
     * @param {string} eventName
     * @param {*} data
     * @param {boolean} bubble Whether event should bubble up components; default = false
     */
    public dispatch(eventName: string, data?: any, bubble: boolean = false) {
        // We use immediate execution here to ensure go up the chain properly,
        //   like DOM events
        this.eventBox.dispatch(eventName, data, bubble ? Infinity : 0, true);
    }

    /**
     * Triggers the "error" event in component, with bubbling.
     * 
     * @param {*} data
     */
    public dispatchError(data?: any) {
        this.eventBox.dispatch("error", data, Infinity, true);
    }

    public init(data?: any) {
        return new Promise((resolve, reject) => {
            try {
                this.initFunc && this.initFunc(data);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    public destroy() {
        this.eventBox.destroy();
        this.destroyFunc && this.destroyFunc();
    }
}