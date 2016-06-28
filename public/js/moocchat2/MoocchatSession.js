define(["require", "exports"], function (require, exports) {
    "use strict";
    var MoocchatSession = (function () {
        function MoocchatSession() {
        }
        MoocchatSession.prototype.setSocket = function (socket) {
            this.socket = socket;
            return this;
        };
        MoocchatSession.prototype.setUser = function (user) {
            this.user = user;
            return this;
        };
        MoocchatSession.prototype.setQuiz = function (quiz) {
            if (!this._quiz) {
                this._quiz = quiz;
            }
            return this;
        };
        MoocchatSession.prototype.setStateMachine = function (stateMachine) {
            if (!this._stateMachine) {
                this._stateMachine = stateMachine;
            }
            return this;
        };
        MoocchatSession.prototype.setPageManager = function (pageManager) {
            if (!this._pageManager) {
                this._pageManager = pageManager;
            }
            return this;
        };
        MoocchatSession.prototype.setSectionManager = function (sectionManager) {
            if (!this._sectionManager) {
                this._sectionManager = sectionManager;
            }
            return this;
        };
        Object.defineProperty(MoocchatSession.prototype, "quiz", {
            get: function () {
                return this._quiz;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MoocchatSession.prototype, "stateMachine", {
            get: function () {
                return this._stateMachine;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MoocchatSession.prototype, "pageManager", {
            get: function () {
                return this._pageManager;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MoocchatSession.prototype, "sectionManager", {
            get: function () {
                return this._sectionManager;
            },
            enumerable: true,
            configurable: true
        });
        return MoocchatSession;
    }());
    exports.MoocchatSession = MoocchatSession;
});
