import {conf} from "../conf";

import * as $ from "jquery";

import {IPageFunc} from "../classes/IPageFunc";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {WebsocketEvents} from "../classes/Websockets";

export let InitialAnswerPageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("initial-answer");
        let maxJustificationLength = conf.answers.justification.maxLength;

        function submitInitialAnswer(answer: number, justification: string) {
            session.answers.initial.answer = answer;
            session.answers.initial.justification = justification.substr(0, maxJustificationLength);

            session.socket.emit(WebsocketEvents.OUTBOUND.INITIAL_ANSWER_SUBMISSION, {
                sessionId: session.sessionId,
                questionId: session.quiz.questionNumber,
                answer: session.answers.initial.answer,
                justification: session.answers.initial.justification
            });
        }

        // Successful initial answer save
        session.socket.once(WebsocketEvents.INBOUND.INITIAL_ANSWER_SUBMISSION_SAVED, () => {
            session.stateMachine.goTo(STATE.AWAIT_GROUP_FORMATION);
        });

        return {
            onEnter: () => {
                session.pageManager.loadPage("initial-answer", (page$) => {
                    section.setActive();
                    section.startTimer();

                    let $answers = page$("#answers");
                    let $answersUL = page$("#answers > ul");
                    let $justification = page$("#answer-justification");
                    let $submitAnswer = page$("#submit-answer");
                    let $charAvailable = page$("#char-available");
                    

                    // Force answer when timer runs out
                    section.attachTimerCompleted(() => {
                        let justification = $.trim($justification.val());
                        let answer = page$("#answers > ul > .selected").index();

                        if (justification.length === 0) {
                            justification = "[NO JUSTIFICATION]";
                        }

                        if (answer < 0) {
                            justification = "[DID NOT ANSWER]";
                            answer = 0;
                        }

                        submitInitialAnswer(answer, justification);
                    });

                    $submitAnswer.on("click", () => {
                        let justification = $.trim($justification.val());
                        let answer = page$("#answers > ul > .selected").index();

                        if (justification.length === 0 || answer < 0) {
                            alert("You must provide an answer and justification.");
                            return;
                        }

                        if (justification.length > maxJustificationLength) {
                            alert("Justification is too long. Reduce your justification length.");
                            return;
                        }

                        submitInitialAnswer(answer, justification);
                    });

                    $answers.on("click", "button", function(e) {
                        e.preventDefault();

                        $("button", $answers).removeClass("selected");

                        $(this).addClass("selected");
                    });

                    $justification.on("change input", () => {
                        let charRemaining = maxJustificationLength - $.trim($justification.val()).length;

                        $charAvailable.text(charRemaining);

                        if (charRemaining < 0) {
                            $charAvailable.addClass("invalid");
                        } else {
                            $charAvailable.removeClass("invalid");
                        }
                    }).trigger("input");


                    // Render question, choices
                    page$("#question-reading").html(session.quiz.questionReading);
                    page$("#question-statement").html(session.quiz.questionStatement);

                    let answerDOMs: JQuery[] = [];
                    session.quiz.questionChoices.forEach((choice) => {
                        answerDOMs.push($("<button>").text(choice));
                    });

                    $answersUL.append(answerDOMs);
                });
            },
            onLeave: () => {
                section.unsetActive();
                section.clearTimer();
                section.hideTimer();
            }
        }
    }
