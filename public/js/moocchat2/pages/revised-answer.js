define(["require", "exports", "../MoocchatStates"], function (require, exports, STATE) {
    "use strict";
    return function (stateMachine, pageManager, secManager) {
        var section = secManager.getSection("revised-answer");
        return {
            onEnter: function () {
                pageManager.loadPage("revised-answer", function (page$) {
                    section.setActive();
                    section.startTimer();
                    page$("button").on("click", function () {
                        stateMachine.goTo(STATE.SURVEY);
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