define(["require", "exports", "../MoocchatStates"], function (require, exports, MoocchatStates_1) {
    "use strict";
    exports.AwaitGroupFormationPageFunc = function (stateMachine, pageManager, secManager) {
        var section = secManager.getSection("discussion");
        return {
            onEnter: function () {
                pageManager.loadPage("await-group-formation", function (page$) {
                    section.setActive();
                    section.setPaused();
                    var waitTime = (Math.random() * 30 * 1000) + (10 * 1000);
                    setTimeout(function () {
                        var playTone = page$("#play-group-formation-tone").is(":checked");
                        sessionStorage.setItem("play-notification-tone", playTone ? "true" : "false");
                        stateMachine.goTo(MoocchatStates_1.MoocchatState.DISCUSSION);
                    }, waitTime);
                });
            },
            onLeave: function () {
            }
        };
    };
});
//# sourceMappingURL=await-group-formation.js.map