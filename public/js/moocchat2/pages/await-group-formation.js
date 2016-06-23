define(["require", "exports", "../MoocchatStates", "../Websockets"], function (require, exports, MoocchatStates_1, Websockets_1) {
    "use strict";
    exports.AwaitGroupFormationPageFunc = function (session) {
        var section = session.sectionManager.getSection("discussion");
        return {
            onEnter: function () {
                session.pageManager.loadPage("await-group-formation", function (page$) {
                    section.setActive();
                    section.setPaused();
                    session.socket.once(Websockets_1.WebsocketEvents.INBOUND.CHAT_GROUP_FORMED, function (data) {
                        var playTone = page$("#play-group-formation-tone").is(":checked");
                        sessionStorage.setItem("play-notification-tone", playTone ? "true" : "false");
                        session.stateMachine.goTo(MoocchatStates_1.MoocchatState.DISCUSSION, data);
                    });
                    session.socket.emit(Websockets_1.WebsocketEvents.OUTBOUND.CHAT_GROUP_JOIN_REQUEST, {
                        username: session.user.username
                    });
                });
            }
        };
    };
});
//# sourceMappingURL=await-group-formation.js.map