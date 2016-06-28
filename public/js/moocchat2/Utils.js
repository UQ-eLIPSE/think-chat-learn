define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.Utils = {
        DateTime: {
            secToMs: function (seconds) {
                return seconds * 1000;
            },
            formatIntervalAsMMSS: function (ms) {
                var minutes = Math.floor(ms / (1000 * 60));
                var seconds = Math.floor(ms % (1000 * 60) / 1000);
                return minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;
            }
        },
        Object: {
            applyConstructor: function (constructor, args) {
                return new (constructor.bind.apply(constructor, [].concat(null, args)));
            }
        }
    };
});
