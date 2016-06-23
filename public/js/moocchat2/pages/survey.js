define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.SurveyPageFunc = function (stateMachine, pageManager, secManager) {
        var section = secManager.getSection("survey");
        return {
            onEnter: function () {
                pageManager.loadPage("survey", function (page$) {
                    section.setActive();
                });
            },
            onLeave: function () {
                section.setInactive();
            }
        };
    };
});
//# sourceMappingURL=survey.js.map