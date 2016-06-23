/*
 * MOOCchat
 * Task section class module
 * 
 * Handles *one* tab of the task section UL in the sidebar
 */

import {Utils} from "./Utils";

export class TaskSection {
    private id: string;

    private milliseconds: number;
    private timerStart: number;
    private lastUpdate: number;
    private rafHandle: number;

    private $elem: JQuery;

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

    public setInactive() {
        this.elem.removeClass("active").removeAttr("data-active-section");
    }

    public setPaused() {
        this.elem.addClass("timer-paused");
    }

    public setUnpaused() {
        this.elem.removeClass("timer-paused");
    }


    public showTimer() {
        this.elem.addClass("timer");
        this.updateTimerText();
    }

    public hideTimer() {
        this.stopTimer();
        this.elem.removeClass("timer");
    }

    public startTimer() {
        this.showTimer();
        this.setUnpaused();
        this.timerStart = Date.now();
        this.runTimerUpdate();
    }

    public stopTimer() {
        cancelAnimationFrame(this.rafHandle);
    }

    private runTimerUpdate() {
        this.rafHandle = requestAnimationFrame(this.updateTimerFrame.bind(this));
    }

    private updateTimerFrame(ms: number) {
        // Only update every 200ms
        if (!this.lastUpdate || ms - this.lastUpdate > 200) {
            this.updateTimerText();
            this.lastUpdate = ms;

            // Halt updating timer when completed
            if (this.timeRemaining < 0) {
                this.handleTimerCompletion();
                return;
            }
        }

        // Frame updates are continuous
        this.runTimerUpdate();
    }

    private updateTimerText() {
        this.elem.attr("data-time-left", Utils.DateTime.formatIntervalAsMMSS(this.timeRemaining));
    }

    private handleTimerCompletion() {
        // TODO: Fire timer expired event of some sort so that we can react to timer finishing
    }

}
