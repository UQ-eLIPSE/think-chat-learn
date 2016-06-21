define(["require", "exports", "../MoocchatStates"], function (require, exports, STATE) {
    "use strict";
    return function (stateMachine, pageManager, secManager) {
        var section = secManager.getSection("initial-answer");
        return {
            onEnter: function () {
                pageManager.loadPage("initial-answer", function (page$) {
                    section.setActive();
                    section.startTimer();
                    page$("button").on("click", function () {
                        stateMachine.goTo(STATE.AWAIT_GROUP_FORMATION);
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
//# sourceMappingURL=initial-answer.js.map