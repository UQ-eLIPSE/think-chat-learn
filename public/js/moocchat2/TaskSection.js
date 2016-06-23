define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    var TaskSection = (function () {
        function TaskSection(id, text, ms) {
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
        TaskSection.prototype.setInactive = function () {
            this.elem.removeClass("active").removeAttr("data-active-section");
        };
        TaskSection.prototype.setPaused = function () {
            this.elem.addClass("timer-paused");
        };
        TaskSection.prototype.setUnpaused = function () {
            this.elem.removeClass("timer-paused");
        };
        TaskSection.prototype.showTimer = function () {
            this.elem.addClass("timer");
            this.updateTimerText();
        };
        TaskSection.prototype.hideTimer = function () {
            this.stopTimer();
            this.elem.removeClass("timer");
        };
        TaskSection.prototype.startTimer = function () {
            this.showTimer();
            this.setUnpaused();
            this.timerStart = Date.now();
            this.runTimerUpdate();
        };
        TaskSection.prototype.stopTimer = function () {
            cancelAnimationFrame(this.rafHandle);
        };
        TaskSection.prototype.runTimerUpdate = function () {
            this.rafHandle = requestAnimationFrame(this.updateTimerFrame.bind(this));
        };
        TaskSection.prototype.updateTimerFrame = function (ms) {
            if (!this.lastUpdate || ms - this.lastUpdate > 200) {
                this.updateTimerText();
                this.lastUpdate = ms;
                if (this.timeRemaining < 0) {
                    this.handleTimerCompletion();
                    return;
                }
            }
            this.runTimerUpdate();
        };
        TaskSection.prototype.updateTimerText = function () {
            this.elem.attr("data-time-left", Utils_1.Utils.DateTime.formatIntervalAsMMSS(this.timeRemaining));
        };
        TaskSection.prototype.handleTimerCompletion = function () {
        };
        return TaskSection;
    }());
    exports.TaskSection = TaskSection;
});
//# sourceMappingURL=TaskSection.js.map