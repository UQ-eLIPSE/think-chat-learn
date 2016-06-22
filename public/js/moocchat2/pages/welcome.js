define(["require", "exports", "../MoocchatStates"], function (require, exports, STATE) {
    "use strict";
    return function (stateMachine, pageManager, secManager) {
        var section = secManager.getSection("welcome");
        return {
            onEnter: function () {
                pageManager.loadPage("welcome", function (page$) {
                    section.setActive();
                    page$("button").on("click", function () {
                        stateMachine.goTo(STATE.INITIAL_ANSWER);
                    });
                    page$("a").on("click", function () {
                        stateMachine.goTo(STATE.DISCUSSION);
                    });
                });
            },
            onLeave: function () {
                section.setInactive();
            }
        };
    };
});
//# sourceMappingURL=welcome.js.map