define(["require", "exports"], function (require, exports) {
    "use strict";
    var MoocchatBridge = (function () {
        function MoocchatBridge() {
        }
        MoocchatBridge.GetBridge = function () {
            var parentWindow = window.parent;
            return parentWindow.getBridge();
        };
        return MoocchatBridge;
    }());
    exports.MoocchatBridge = MoocchatBridge;
});
