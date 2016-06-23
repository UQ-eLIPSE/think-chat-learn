define(["require", "exports", "../MoocchatStates"], function (require, exports, MoocchatStates_1) {
    "use strict";
    exports.WelcomePageFunc = function (stateMachine, pageManager, secManager) {
        var section = secManager.getSection("welcome");
        return {
            onEnter: function () {
                pageManager.loadPage("welcome", function (page$) {
                    section.setActive();
                    page$("button").on("click", function () {
                        stateMachine.goTo(MoocchatStates_1.MoocchatState.INITIAL_ANSWER);
                    });
                    page$("a").on("click", function () {
                        stateMachine.goTo(MoocchatStates_1.MoocchatState.DISCUSSION);
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