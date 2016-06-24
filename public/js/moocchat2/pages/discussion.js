define(["require", "exports", "../MoocchatStates", "../MoocchatChat"], function (require, exports, MoocchatStates_1, MoocchatChat_1) {
    "use strict";
    exports.DiscussionPageFunc = function (session) {
        var section = session.sectionManager.getSection("discussion");
        return {
            onEnter: function (data) {
                session.pageManager.loadPage("discussion", function (page$) {
                    section.setActive();
                    section.startTimer();
                    var $activeSection = $("[data-active-section]", "#session-sections");
                    var $chatBox = page$("#chat-box");
                    var chat = new MoocchatChat_1.MoocchatChat(session, data, $chatBox);
                    function endChat() {
                        chat.terminate();
                        session.stateMachine.goTo(MoocchatStates_1.MoocchatState.REVISED_ANSWER);
                    }
                    page$("#end-chat").on("click", function () {
                        endChat();
                    });
                    section.attachTimerCompleted(function () {
                        endChat();
                    });
                    var playTone = sessionStorage.getItem("play-notification-tone") === "true";
                    if (playTone) {
                        var notificationTone = new Audio("./mp3/here-i-am.mp3");
                        notificationTone.play();
                    }
                    sessionStorage.removeItem("play-notification-tone");
                    page$("#chat-input-wrapper").on("submit", function (e) {
                        e.preventDefault();
                        var message = page$("#chat-input").val();
                        if (message.length === 0) {
                            return;
                        }
                        chat.sendMessage(message);
                        page$("#chat-input").val("").focus();
                    });
                    chat.displaySystemMessage("Your discussion group has " + data.groupSize + " member" + ((data.groupSize !== 1) ? "s" : " only"));
                    chat.displaySystemMessage("You are Person #" + (data.clientIndex + 1));
                    data.groupAnswers.forEach(function (answerData) {
                        chat.displayMessage(answerData.clientIndex + 1, "Answer = " + String.fromCharCode(65 + answerData.answer) + "; Justification = " + answerData.justification);
                    });
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
                section.unsetActive();
                section.hideTimer();
            }
        };
    };
});
//# sourceMappingURL=discussion.js.map