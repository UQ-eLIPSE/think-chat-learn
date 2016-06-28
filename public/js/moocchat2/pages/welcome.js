define(["require", "exports", "../MoocchatStates", "../MoocchatUser", "../MoocchatQuiz"], function (require, exports, MoocchatStates_1, MoocchatUser_1, MoocchatQuiz_1) {
    "use strict";
    exports.WelcomePageFunc = function (session) {
        var section = session.sectionManager.getSection("welcome");
        return {
            onEnter: function () {
                session.pageManager.loadPage("welcome", function (page$) {
                    section.setActive();
                    page$("button").on("click", function () {
                        var username = prompt("username", "test2");
                        var user = new MoocchatUser_1.MoocchatUser(username);
                        user.onLoginSuccess = function (data) {
                            session.setQuiz(new MoocchatQuiz_1.MoocchatQuiz(data.quiz));
                            session.setUser(user);
                            session.stateMachine.goTo(MoocchatStates_1.MoocchatState.INITIAL_ANSWER);
                        };
                        user.onLoginFail = function (data) {
                            var reason;
                            if (typeof data === "string") {
                                reason = data;
                            }
                            else {
                                reason = "User \"" + data.username + "\" is still signed in";
                            }
                            alert("Login failed.\n\n" + reason);
                        };
                        user.login(session.socket);
                    });
                    page$("a").on("click", function () {
                        session.stateMachine.goTo(MoocchatStates_1.MoocchatState.DISCUSSION);
                    });
                });
            },
            onLeave: function () {
                section.unsetActive();
            }
        };
    };
});
