define(["require", "exports"], function (require, exports) {
    "use strict";
    var StateFlow = (function () {
        function StateFlow() {
            this.states = {};
            this.history = [];
        }
        StateFlow.prototype.register = function (data) {
            this.states[data.state.toString()] = data;
        };
        StateFlow.prototype.registerAll = function (dataArray) {
            var _this = this;
            dataArray.forEach(function (data) { return _this.register(data); });
        };
        StateFlow.prototype.goTo = function (newState, goToData) {
            var oldStateData = this.getCurrentState();
            var newStateData = this.getStateData(newState);
            var onLeaveData;
            if (oldStateData) {
                var onLeave = oldStateData.onLeave;
                if (onLeave) {
                    onLeaveData = onLeave(goToData, newStateData.state);
                }
            }
            this.setNewStateData(newStateData);
            var onEnter = newStateData.onEnter;
            if (onEnter) {
                onEnter(goToData, onLeaveData, ((oldStateData) ? oldStateData.state : void 0));
            }
        };
        StateFlow.prototype.getStateData = function (state) {
            return this.states[state.toString()];
        };
        StateFlow.prototype.setNewStateData = function (data) {
            this.history.push(data);
        };
        StateFlow.prototype.getCurrentState = function () {
            if (this.history.length === 0) {
                return;
            }
            return this.history[this.history.length - 1];
        };
        return StateFlow;
    }());
    exports.StateFlow = StateFlow;
});
