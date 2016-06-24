define(["require", "exports"], function (require, exports) {
    "use strict";
    var EventBox = (function () {
        function EventBox() {
            this.eventCallbacks = {};
            this.dispatchedEvents = {};
        }
        EventBox.prototype.on = function (eventName, callback, runCallbackOnBindIfDispatched) {
            if (runCallbackOnBindIfDispatched === void 0) { runCallbackOnBindIfDispatched = true; }
            var registeredCallbacks = this.eventCallbacks[eventName];
            if (!registeredCallbacks) {
                this.eventCallbacks[eventName] = [];
            }
            this.eventCallbacks[eventName].push(callback);
            if (runCallbackOnBindIfDispatched && this.hasEventBeenDispatched(eventName)) {
                (function (callback, data) {
                    callback(data);
                })(callback, this.dispatchedEvents[eventName]);
            }
        };
        EventBox.prototype.off = function (eventName, callback) {
            var registeredCallbacks = this.eventCallbacks[eventName];
            if (!registeredCallbacks) {
                return;
            }
            if (callback) {
                var index = registeredCallbacks.indexOf(callback);
                if (index < 0) {
                    return;
                }
                registeredCallbacks.splice(index, 1);
                return;
            }
            delete this.eventCallbacks[eventName];
        };
        EventBox.prototype.dispatch = function (eventName, data) {
            this.dispatchedEvents[eventName] = data;
            this.runCallbacks(eventName, data);
        };
        EventBox.prototype.runCallbacks = function (eventName, data) {
            var callbacks = this.eventCallbacks[eventName];
            if (callbacks) {
                callbacks.forEach(function (callback) {
                    callback(data);
                });
            }
        };
        EventBox.prototype.hasEventBeenDispatched = function (eventName) {
            return (Object.keys(this.dispatchedEvents).indexOf(eventName) > -1);
        };
        return EventBox;
    }());
    exports.EventBox = EventBox;
});
//# sourceMappingURL=EventBox.js.map