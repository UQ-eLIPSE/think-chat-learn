import * as $ from "jquery";

import {IPageFunc} from "../IPageFunc";

import {MoocchatState as STATE} from "../MoocchatStates";

import {WebsocketEvents} from "../Websockets";

export let InitialAnswerPageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("initial-answer");

        function submitInitialAnswer(answer: number, justification: string) {
            session.socket.emit(WebsocketEvents.OUTBOUND.INITIAL_ANSWER_SUBMISSION, {
                sessionId: session.sessionId,
                questionId: session.quiz.questionNumber,
                answer: answer,
                justification: justification
            });
        }

        // Force answer when timer runs out
        section.attachTimerCompleted(() => {
            // TODO: Use whatever is on the page rather than fixed values
            submitInitialAnswer(0, "Did not answer");
        });

        // Successful initial answer save
        session.socket.once(WebsocketEvents.INBOUND.INITIAL_ANSWER_SUBMISSION_SAVED, () => {
            session.stateMachine.goTo(STATE.AWAIT_GROUP_FORMATION);
        });

        return {
            onEnter: () => {
                session.pageManager.loadPage("initial-answer", (page$) => {
                    section.setActive();
                    section.startTimer();

                    page$("#submit-answer").on("click", () => {
                        let justification = $.trim(page$("#answer-justification").val());
                        let answer = page$("#answers > ul > li.selected").index();

                        if (justification.length === 0 || answer < 0) {
                            alert("You must provide an answer.");
                            return;
                        }

                        submitInitialAnswer(answer, justification);
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
