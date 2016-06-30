import * as $ from "jquery";

import {IPageFunc} from "../classes/IPageFunc";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {WebsocketEvents} from "../classes/Websockets";

export let RevisedAnswerPageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("revised-answer");

        function submitRevisedAnswer(answer: number, justification: string) {
            session.socket.emit(WebsocketEvents.OUTBOUND.REVISED_ANSWER_SUBMISSION, {
                sessionId: session.sessionId,
                questionNumber: session.quiz.questionNumber,
                answer: answer,
                justification: justification,

                screenName: "",         // Not used
                quizRoomID: -1,         // Not used
                timestamp: new Date().toISOString()
            });

            session.stateMachine.goTo(STATE.SURVEY);
        }

        // Force answer when timer runs out
        section.attachTimerCompleted(() => {
            // TODO: Use whatever is on the page rather than fixed values
            submitRevisedAnswer(0, "Did not answer");
        });

        return {
            onEnter: () => {
                session.pageManager.loadPage("revised-answer", (page$) => {
                    section.setActive();
                    section.startTimer();

                    page$("#submit-answer").on("click", () => {
                        let justification = $.trim(page$("#answer-justification").val());
                        let answer = page$("#answers > ul > li.selected").index();

                        if (justification.length === 0 || answer < 0) {
                            alert("You must provide an answer.");
                            return;
                        }

                        submitRevisedAnswer(answer, justification);
                    });


                    let $answers = page$("#answers");

                    $answers.on("click", "li", function(e) {
                        e.preventDefault();

                        $("li", $answers).removeClass("selected");

                        $(this).addClass("selected");
                    });


                    let $answersUL = page$("#answers > ul");

                    let answerDOMs: JQuery[] = [];

                    // Render question, choices
                    page$("#question-reading").html(session.quiz.questionReading);
                    page$("#question-statement").html(session.quiz.questionStatement);

                    session.quiz.questionChoices.forEach((choice) => {
                        answerDOMs.push($("<li>").text(choice));
                    });

                    $answersUL.append(answerDOMs);
                });
            },
            onLeave: () => {
                section.unsetActive();
                section.hideTimer();
            }
        }
    }
