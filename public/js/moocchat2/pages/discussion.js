define(["require", "exports", "../MoocchatStates", "../MoocchatChat"], function (require, exports, MoocchatStates_1, MoocchatChat_1) {
    "use strict";
    exports.DiscussionPageFunc = function (session) {
        var section = session.sectionManager.getSection("discussion");
        return {
            onEnter: function (data) {
                session.pageManager.loadPage("discussion", function (page$) {
                    section.setActive();
                    section.startTimer();
                    page$("#end-chat").on("click", function () {
                        chat.terminate();
                        session.stateMachine.goTo(MoocchatStates_1.MoocchatState.REVISED_ANSWER);
                    });
                    var $activeSection = $("[data-active-section]", "#session-sections");
                    var $chatBox = page$("#chat-box");
                    var playTone = sessionStorage.getItem("play-notification-tone") === "true";
                    if (playTone) {
                        var notificationTone = new Audio("./mp3/here-i-am.mp3");
                        notificationTone.play();
                    }
                    sessionStorage.removeItem("play-notification-tone");
                    var chat = new MoocchatChat_1.MoocchatChat(session, data, $chatBox);
                    page$("#chat-input-wrapper").on("submit", function (e) {
                        e.preventDefault();
                        var message = page$("#chat-input").val();
                        if (message.length === 0) {
                            return;
                        }
                        chat.sendMessage(message);
                        page$("#chat-input").val("").focus();
                    });
                    chat.displayMessage(-1, "Your discussion group has " + data.groupSize + " member" + ((data.groupSize !== 1) ? "s" : " only"));
                    chat.displayMessage(-1, "You are Person #" + (data.clientIndex + 1));
                    var $answersUL = page$("#chat-answers > ul");
                    var answerDOMs = [];
                    page$("#question-reading").html(session.quiz.questionReading);
                    page$("#question-statement").html(session.quiz.questionStatement);
                    session.quiz.questionChoices.forEach(function (choice) {
                        answerDOMs.push($("<li>").text(choice));
                    });
                    $answersUL.append(answerDOMs);
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