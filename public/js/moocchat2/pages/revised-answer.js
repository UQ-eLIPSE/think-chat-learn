define(["require", "exports", "jquery", "../MoocchatStates", "../Websockets"], function (require, exports, $, MoocchatStates_1, Websockets_1) {
    "use strict";
    exports.RevisedAnswerPageFunc = function (session) {
        var section = session.sectionManager.getSection("revised-answer");
        function submitRevisedAnswer(answer, justification) {
            session.socket.emit(Websockets_1.WebsocketEvents.OUTBOUND.REVISED_ANSWER_SUBMISSION, {
                username: session.user.username,
                questionNumber: session.quiz.questionNumber,
                answer: answer,
                justification: justification,
                screenName: "",
                quizRoomID: -1,
                timestamp: new Date().toISOString()
            });
            session.stateMachine.goTo(MoocchatStates_1.MoocchatState.SURVEY);
        }
        section.attachTimerCompleted(function () {
            submitRevisedAnswer(0, "Did not answer");
        });
        return {
            onEnter: function () {
                session.pageManager.loadPage("revised-answer", function (page$) {
                    section.setActive();
                    section.startTimer();
                    page$("#submit-answer").on("click", function () {
                        var justification = $.trim(page$("#answer-justification").val());
                        var answer = page$("#answers > ul > li.selected").index();
                        if (justification.length === 0 || answer < 0) {
                            alert("You must provide an answer.");
                            return;
                        }
                        submitRevisedAnswer(answer, justification);
                    });
                    var $answers = page$("#answers");
                    $answers.on("click", "li", function (e) {
                        e.preventDefault();
                        $("li", $answers).removeClass("selected");
                        $(this).addClass("selected");
                    });
                    var $answersUL = page$("#answers > ul");
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
//# sourceMappingURL=revised-answer.js.map