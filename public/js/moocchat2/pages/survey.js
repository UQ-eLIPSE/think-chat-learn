define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.SurveyPageFunc = function (session) {
        var section = session.sectionManager.getSection("survey");
        return {
            onEnter: function () {
                session.pageManager.loadPage("survey", function (page$) {
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