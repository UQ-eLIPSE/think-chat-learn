import {conf} from "../conf";

import * as $ from "jquery";

import {IPageFunc} from "../classes/IPageFunc";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {WebsocketEvents} from "../classes/Websockets";

export let RevisedAnswerPageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("revised-answer");
        let maxJustificationLength = conf.answers.justification.maxLength;

        function submitRevisedAnswer(answer: number, justification: string) {
            session.answers.revised.answer = answer;
            session.answers.initial.justification = justification.substr(0, maxJustificationLength);

            session.socket.emit(WebsocketEvents.OUTBOUND.REVISED_ANSWER_SUBMISSION, {
                sessionId: session.sessionId,
                questionNumber: session.quiz.questionNumber,
                answer: session.answers.revised.answer,
                justification: session.answers.revised.justification,

                screenName: "",         // Not used
                quizRoomID: -1,         // Not used
                timestamp: new Date().toISOString()
            });

            session.stateMachine.goTo(STATE.SURVEY);
        }

        return {
            onEnter: () => {
                session.pageManager.loadPage("revised-answer", (page$) => {
                    section.setActive();
                    section.startTimer();

                    let $answers = page$("#answers");
                    let $answersUL = page$("#answers > ul");
                    let $justification = page$("#answer-justification");
                    let $submitAnswer = page$(".submit-answer-button");
                    let $charAvailable = page$("#char-available");
                    let $enableRevision = page$("#enable-revision");

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

                        submitRevisedAnswer(answer, justification);
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

                        submitRevisedAnswer(answer, justification);
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

                    $enableRevision.on("click", () => {
                        page$(".pre-edit-enable").hide();
                        page$(".post-edit-enable").show();
                        $answers.removeClass("locked");
                        $justification.prop("disabled", false);

                        $answers.on("click", "button", function(e) {
                            e.preventDefault();

                            $("button", $answers).removeClass("selected");

                            $(this).addClass("selected");
                        });
                    });


                    // Render question, choices
                    page$("#question-reading").html(session.quiz.questionReading);
                    page$("#question-statement").html(session.quiz.questionStatement);

                    let answerDOMs: JQuery[] = [];
                    session.quiz.questionChoices.forEach((choice) => {
                        answerDOMs.push($("<button>").text(choice));
                    });

                    $answersUL.append(answerDOMs);


                    // Populate previous answer
                    $justification.val(session.answers.initial.justification);
                    $("button", $answers).eq(session.answers.initial.answer).addClass("selected");


                    // Set pre-/post-edit-enable elements
                    $justification.prop("disabled", true);
                    page$(".post-edit-enable").hide();
                    $answers.addClass("locked");
                });
            },
            onLeave: () => {
                section.unsetActive();
                section.clearTimer();
                section.hideTimer();
            }
        }
    }
