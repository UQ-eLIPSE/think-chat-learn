/*
 * MOOCchat
 * Task section class module
 * 
 * Handles *one* tab of the task section UL in the sidebar
 */

import {Utils} from "./Utils";

import {EventBox, EventBoxCallback} from "./EventBox";

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

    public get identifier() {
        return this.id;
    }

    public get elem() {
        return this.$elem;
    }

    /** Time remaining in milliseconds */
    public get timeRemaining() {
        if (this.timerStart) {
            return this.milliseconds - (Date.now() - this.timerStart);
        }

        return this.milliseconds;
    }



    private generateElement(text: string) {
        let $sectionElement = $("<li>");

        $sectionElement.attr("data-section", this.id).text(text);

        return $sectionElement;
    }



    public setActive() {
        this.elem.addClass("active").attr("data-active-section", "");
    }

    public unsetActive() {
        this.elem.removeClass("active").removeAttr("data-active-section");
        this.unsetOutOfTime();
    }

    public setPaused() {
        this.elem.addClass("timer-paused");
    }

    public unsetPaused() {
        this.elem.removeClass("timer-paused");
        this.unsetOutOfTime();
    }

    public setOutOfTime() {
        this.elem.addClass("out-of-time");
        this.outOfTime = true;

        this.outOfTimeAlternationIntervalHandle = setInterval(() => {
            this.elem.toggleClass("out-of-time-2");
        }, 500);
    }

    public unsetOutOfTime() {
        clearInterval(this.outOfTimeAlternationIntervalHandle);
        this.elem.removeClass("out-of-time out-of-time-2");
    }


    public showTimer() {
        this.elem.addClass("timer");
        this.updateTimerText();
    }

    public hideTimer() {
        this.stopTimer();
        this.elem.removeClass("timer");
        this.unsetOutOfTime();
    }

    public startTimer() {
        this.showTimer();
        this.unsetPaused();

        this.timerStart = Date.now();
        this.timerActive = true;
        
        this.runTimerUpdate();
    }

    public stopTimer() {
        this.timerActive = false;

        cancelAnimationFrame(this.rafHandle);
    }

    private runTimerUpdate() {
        this.rafHandle = requestAnimationFrame(this.updateTimerFrame.bind(this));
    }

    private updateTimerFrame(ms: number) {
        // Terminate refresh loop when timer inactive
        if (!this.timerActive) {
            return;
        }

        // Only update every 200ms
        if (!this.lastUpdate || ms - this.lastUpdate > 200) {
            this.updateTimerText();
            this.lastUpdate = ms;

            // Last 60 seconds = out of time state
            if (!this.outOfTime && this.timeRemaining < 60 * 1000) {
                this.setOutOfTime();
            }

            // Halt updating timer when completed
            if (this.timeRemaining <= 200) {
                this.runTimerCompletionCallbacks();
                return;     // This halts the update loop
            }
        }

        // Frame updates are continuous
        this.runTimerUpdate();
    }

    private updateTimerText() {
        this.elem.attr("data-time-left", Utils.DateTime.formatIntervalAsMMSS(this.timeRemaining));
    }

    public attachTimerCompleted(callback: EventBoxCallback, runCallbackOnBindIfFired?: boolean) {
        this.eventBox.on("timerCompleted", callback, runCallbackOnBindIfFired);
    }

    public detachTimerCompleted(callback: EventBoxCallback) {
        this.eventBox.off("timerCompleted", callback);
    }

    private runTimerCompletionCallbacks() {
        this.eventBox.dispatch("timerCompleted");
    }

}
