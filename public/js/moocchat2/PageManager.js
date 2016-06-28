define(["require", "exports", "jquery"], function (require, exports, $) {
    "use strict";
    var PageManager = (function () {
        function PageManager($contentElem) {
            this.$contentElem = $contentElem;
        }
        PageManager.prototype.page$ = function (selector) {
            if (selector) {
                return $(selector, this.$contentElem);
            }
            return this.$contentElem;
        };
        PageManager.prototype.loadPage = function (name, onDone) {
            var _this = this;
            var pageFetchXHR = $.ajax({
                url: "./html/" + name + ".html",
                dataType: "html",
                method: "GET"
            });
            pageFetchXHR.done(function (html) {
                _this.$contentElem.html(html);
                if (onDone) {
                    onDone(_this.page$.bind(_this));
                }
            });
            return pageFetchXHR;
        };
        return PageManager;
    }());
    exports.PageManager = PageManager;
});
