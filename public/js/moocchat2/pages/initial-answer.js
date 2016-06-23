define(["require", "exports", "jquery", "../MoocchatStates", "../Websockets"], function (require, exports, $, MoocchatStates_1, Websockets_1) {
    "use strict";
    exports.InitialAnswerPageFunc = function (session) {
        var section = session.sectionManager.getSection("initial-answer");
        session.socket.once(Websockets_1.WebsocketEvents.INBOUND.INITIAL_ANSWER_SUBMISSION_SAVED, function () {
            session.stateMachine.goTo(MoocchatStates_1.MoocchatState.AWAIT_GROUP_FORMATION);
        });
        return {
            onEnter: function () {
                session.pageManager.loadPage("initial-answer", function (page$) {
                    section.setActive();
                    section.startTimer();
                    page$("#submit-answer").on("click", function () {
                        var justification = $.trim(page$("#answer-justification").val());
                        var answer = page$("#answers > ul > li.selected").index();
                        if (justification.length === 0 || answer < 0) {
                            alert("You must provide an answer.");
                            return;
                        }
                        session.socket.emit(Websockets_1.WebsocketEvents.OUTBOUND.INITIAL_ANSWER_SUBMISSION, {
                            username: session.user.username,
                            questionId: session.quiz.questionNumber,
                            answer: answer,
                            justification: justification
                        });
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
                section.setInactive();
                section.hideTimer();
            }
        };
    };
});
//# sourceMappingURL=initial-answer.js.map