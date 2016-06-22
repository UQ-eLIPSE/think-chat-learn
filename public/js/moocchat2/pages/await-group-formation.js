define(["require", "exports", "../MoocchatStates"], function (require, exports, STATE) {
    "use strict";
    return function (stateMachine, pageManager, secManager) {
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
                        stateMachine.goTo(STATE.DISCUSSION);
                    }, waitTime);
                });
            },
            onLeave: function () {
            }
        };
    };
});
//# sourceMappingURL=await-group-formation.js.map