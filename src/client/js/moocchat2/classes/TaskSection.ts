import {conf} from "../conf";

import {Utils} from "./Utils";

import {EventBox, EventBoxCallback} from "./EventBox";

const TaskSection_InternalLoginEvents = {
    TIMER_COMPLETED: "MCTS_TIMER_COMPLETED"
}

/**
 * MOOCchat
 * Task section class module
 * 
 * Handles *one* tab of the task section UL in the sidebar
 */
export class TaskSection {
    private id: string;

    private milliseconds: number;
    private timerStart: number;
    private timerActive: boolean = false;
    private lastUpdate: number;
    private rafHandle: number;

    private $elem: JQuery;

    private outOfTime: boolean = false;
    private outOfTimeAlternationIntervalHandle: number;

    private eventBox: EventBox = new EventBox();

    /**
     * @param {string} id
     * @param {string} text Text presented in the element itself
     * @param {number} ms Timer value in milliseconds
     */
    constructor(id: string, text: string, ms?: number) {
        this.id = id;
        this.milliseconds = ms;

        this.$elem = this.generateElement(text);

        if (ms) {
            this.showTimer();
        }
    }

    /**
     * The ID of the task section
     * 
     * @return {string}
     */
    public get identifier() {
        return this.id;
    }

    /**
     * The jQuery wrapped element of the task section
     * 
     * @return {JQuery}
     */
    public get elem() {
        return this.$elem;
    }

    /**
     * Time remaining in milliseconds
     * 
     * @return {number}
     */
    public get timeRemaining() {
        if (this.timerStart) {
            return this.milliseconds - (Date.now() - this.timerStart);
        }

        return this.milliseconds;
    }

    /**
     * Create the element to be injected into the page for a task section.
     * 
     * @return {JQuery}
     */
    private generateElement(text: string) {
        let $sectionElement = $("<li>");

        $sectionElement.attr("data-section", this.id).text(text);

        return $sectionElement;
    }

    /**
     * Sets state of task section to active.
     */
    public setActive() {
        this.elem.addClass("active").attr("data-active-section", "");
    }

    /**
     * Unsets state of task section from active.
     */
    public unsetActive() {
        this.elem.removeClass("active").removeAttr("data-active-section");
        this.unsetOutOfTime();
    }

    /**
     * Sets state of task section to paused.
     */
    public setPaused() {
        this.elem.addClass("timer-paused");
    }

    /**
     * Unsets state of task section from paused.
     */
    public unsetPaused() {
        this.elem.removeClass("timer-paused");
        this.unsetOutOfTime();
    }

    /**
     * Sets state of task section to "out of time".
     */
    public setOutOfTime() {
        this.elem.addClass("out-of-time");
        this.outOfTime = true;

        this.outOfTimeAlternationIntervalHandle = setInterval(() => {
            this.elem.toggleClass("out-of-time-2");
        }, 500);
    }

    /**
     * Unsets state of task section from "out of time".
     */
    public unsetOutOfTime() {
        clearInterval(this.outOfTimeAlternationIntervalHandle);
        this.elem.removeClass("out-of-time out-of-time-2");
    }

    /**
     * Makes timer visible.
     */
    public showTimer() {
        this.elem.addClass("timer");
        this.updateTimerText();
    }

    /**
     * Makes timer not visible and stops the timer.
     */
    public hideTimer() {
        this.stopTimer();
        this.elem.removeClass("timer");
        this.unsetOutOfTime();
    }

    /**
     * Starts timer and shows timer if necessary.
     */
    public startTimer() {
        this.showTimer();
        this.unsetPaused();

        this.timerStart = Date.now();
        this.timerActive = true;

        this.requestTimerUpdate();
    }

    /**
     * Stops timer.
     */
    public stopTimer() {
        this.timerActive = false;

        cancelAnimationFrame(this.rafHandle);
    }

    /**
     * Clears all callbacks and stops timer.
     */
    public clearTimer() {
        this.stopTimer();
        this.detachTimerCompleted();

        this.timerStart = undefined;
        this.updateTimerText();
    }

    /**
     * Request timer update on next frame render.
     */
    private requestTimerUpdate() {
        this.rafHandle = requestAnimationFrame(this.updateTimerFrame.bind(this));
    }

    /**
     * Updates timer visually and triggers request for timer update on next frame render. 
     */
    private updateTimerFrame(ms: number) {
        // Terminate refresh loop when timer inactive
        if (!this.timerActive) {
            return;
        }

        // Only update every 200ms
        const timerUpdateIntervalMs = 200;
        if (!this.lastUpdate || ms - this.lastUpdate > timerUpdateIntervalMs) {
            this.updateTimerText();
            this.lastUpdate = ms;

            // Last 60 seconds = out of time state
            if (!this.outOfTime && this.timeRemaining < conf.taskTimer.outOfTimeRemainingMs) {
                this.setOutOfTime();
            }

            // Halt updating timer when completed
            if (this.timeRemaining <= timerUpdateIntervalMs) {
                this.runTimerCompletionCallbacks();
                
                // Clear all timer callbacks (as timers are intended to be run once only)
                this.clearTimer();

                return;     // This halts the update loop
            }
        }

        // Frame updates are continuous
        this.requestTimerUpdate();
    }

    /**
     * Update timer text with time remaining value.
     */
    private updateTimerText() {
        this.elem.attr("data-time-left", Utils.DateTime.formatIntervalAsMMSS(this.timeRemaining));
    }

    /**
     * Attach callback to timer completed event.
     * 
     * @param {EventBoxCallback} callback
     * @param {boolean} runCallbackOnBindIfFired Run callback when bound, if event has already previously occurred.
     */
    public attachTimerCompleted(callback: EventBoxCallback, runCallbackOnBindIfFired?: boolean) {
        this.eventBox.on(TaskSection_InternalLoginEvents.TIMER_COMPLETED, callback, runCallbackOnBindIfFired);
    }

    /**
     * Detach callback from timer completed event.
     * 
     * @param {EventBoxCallback} callback
     */
    public detachTimerCompleted(callback?: EventBoxCallback) {
        this.eventBox.off(TaskSection_InternalLoginEvents.TIMER_COMPLETED, callback);
    }

    /**
     * Run all callbacks for timer completed event.
     */
    private runTimerCompletionCallbacks() {
        this.eventBox.dispatch(TaskSection_InternalLoginEvents.TIMER_COMPLETED);
    }

}
