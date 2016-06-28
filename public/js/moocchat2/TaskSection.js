define(["require", "exports", "./Utils", "./EventBox"], function (require, exports, Utils_1, EventBox_1) {
    "use strict";
    var TaskSection_InternalLoginEvents = {
        TIMER_COMPLETED: "MCTS_TIMER_COMPLETED"
    };
    var TaskSection = (function () {
        function TaskSection(id, text, ms) {
            this.timerActive = false;
            this.outOfTime = false;
            this.eventBox = new EventBox_1.EventBox();
            this.id = id;
            this.milliseconds = ms;
            this.$elem = this.generateElement(text);
            if (ms) {
                this.showTimer();
            }
        }
        Object.defineProperty(TaskSection.prototype, "identifier", {
            get: function () {
                return this.id;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TaskSection.prototype, "elem", {
            get: function () {
                return this.$elem;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TaskSection.prototype, "timeRemaining", {
            get: function () {
                if (this.timerStart) {
                    return this.milliseconds - (Date.now() - this.timerStart);
                }
                return this.milliseconds;
            },
            enumerable: true,
            configurable: true
        });
        TaskSection.prototype.generateElement = function (text) {
            var $sectionElement = $("<li>");
            $sectionElement.attr("data-section", this.id).text(text);
            return $sectionElement;
        };
        TaskSection.prototype.setActive = function () {
            this.elem.addClass("active").attr("data-active-section", "");
        };
        TaskSection.prototype.unsetActive = function () {
            this.elem.removeClass("active").removeAttr("data-active-section");
            this.unsetOutOfTime();
        };
        TaskSection.prototype.setPaused = function () {
            this.elem.addClass("timer-paused");
        };
        TaskSection.prototype.unsetPaused = function () {
            this.elem.removeClass("timer-paused");
            this.unsetOutOfTime();
        };
        TaskSection.prototype.setOutOfTime = function () {
            var _this = this;
            this.elem.addClass("out-of-time");
            this.outOfTime = true;
            this.outOfTimeAlternationIntervalHandle = setInterval(function () {
                _this.elem.toggleClass("out-of-time-2");
            }, 500);
        };
        TaskSection.prototype.unsetOutOfTime = function () {
            clearInterval(this.outOfTimeAlternationIntervalHandle);
            this.elem.removeClass("out-of-time out-of-time-2");
        };
        TaskSection.prototype.showTimer = function () {
            this.elem.addClass("timer");
            this.updateTimerText();
        };
        TaskSection.prototype.hideTimer = function () {
            this.stopTimer();
            this.elem.removeClass("timer");
            this.unsetOutOfTime();
        };
        TaskSection.prototype.startTimer = function () {
            this.showTimer();
            this.unsetPaused();
            this.timerStart = Date.now();
            this.timerActive = true;
            this.requestTimerUpdate();
        };
        TaskSection.prototype.stopTimer = function () {
            this.timerActive = false;
            cancelAnimationFrame(this.rafHandle);
        };
        TaskSection.prototype.requestTimerUpdate = function () {
            this.rafHandle = requestAnimationFrame(this.updateTimerFrame.bind(this));
        };
        TaskSection.prototype.updateTimerFrame = function (ms) {
            if (!this.timerActive) {
                return;
            }
            if (!this.lastUpdate || ms - this.lastUpdate > 200) {
                this.updateTimerText();
                this.lastUpdate = ms;
                if (!this.outOfTime && this.timeRemaining < 60 * 1000) {
                    this.setOutOfTime();
                }
                if (this.timeRemaining <= 200) {
                    this.runTimerCompletionCallbacks();
                    return;
                }
            }
            this.requestTimerUpdate();
        };
        TaskSection.prototype.updateTimerText = function () {
            this.elem.attr("data-time-left", Utils_1.Utils.DateTime.formatIntervalAsMMSS(this.timeRemaining));
        };
        TaskSection.prototype.attachTimerCompleted = function (callback, runCallbackOnBindIfFired) {
            this.eventBox.on(TaskSection_InternalLoginEvents.TIMER_COMPLETED, callback, runCallbackOnBindIfFired);
        };
        TaskSection.prototype.detachTimerCompleted = function (callback) {
            this.eventBox.off(TaskSection_InternalLoginEvents.TIMER_COMPLETED, callback);
        };
        TaskSection.prototype.runTimerCompletionCallbacks = function () {
            this.eventBox.dispatch(TaskSection_InternalLoginEvents.TIMER_COMPLETED);
        };
        return TaskSection;
    }());
    exports.TaskSection = TaskSection;
});
