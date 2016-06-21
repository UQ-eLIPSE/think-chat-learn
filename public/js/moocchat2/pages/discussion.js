define(["require", "exports", "../MoocchatStates"], function (require, exports, STATE) {
    "use strict";
    return function (stateMachine, pageManager, secManager) {
        var section = secManager.getSection("discussion");
        return {
            onEnter: function () {
                pageManager.loadPage("discussion", function (page$) {
                    section.setActive();
                    section.startTimer();
                    page$("button").on("click", function () {
                        stateMachine.goTo(STATE.REVISED_ANSWER);
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
//# sourceMappingURL=discussion.js.map