define(["require", "exports", "../MoocchatStates"], function (require, exports, MoocchatStates_1) {
    "use strict";
    exports.RevisedAnswerPageFunc = function (stateMachine, pageManager, secManager) {
        var section = secManager.getSection("revised-answer");
        return {
            onEnter: function () {
                pageManager.loadPage("revised-answer", function (page$) {
                    section.setActive();
                    section.startTimer();
                    page$("button").on("click", function () {
                        stateMachine.goTo(MoocchatStates_1.MoocchatState.AWAIT_GROUP_FORMATION);
                    });
                    var $answers = page$("#answers");
                    $answers.on("click", "li", function (e) {
                        e.preventDefault();
                        $("li", $answers).removeClass("selected");
                        $(this).addClass("selected");
                    });
                });
            },
            onLeave: function () {
                section.setInactive();
                section.hideTimer();
            }
        };
    };
});
//# sourceMappingURL=revised-answer.js.map