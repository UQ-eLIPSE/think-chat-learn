define(["require", "exports"], function (require, exports) {
    "use strict";
    var Util = (function () {
        function Util() {
        }
        Util.OnDoneFactory = function (count, callback) {
            return function () {
                if (--count <= 0) {
                    callback();
                }
            };
        };
        return Util;
    }());
    exports.Util = Util;
});
