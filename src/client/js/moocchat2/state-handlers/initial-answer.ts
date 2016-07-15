import {conf} from "../conf";

import * as $ from "jquery";

import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {WebsocketEvents} from "../classes/WebsocketEvents";
import * as IOutboundData from "../classes/IOutboundData";

export const InitialAnswerStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("initial-answer");
        const maxJustificationLength = conf.answers.justification.maxLength;

        function submitInitialAnswer(optionId: string, justification: string) {
            session.answers.initial.optionId = optionId;
            session.answers.initial.justification = justification.substr(0, maxJustificationLength);

            session.socket.emitData<IOutboundData.InitialAnswer>(WebsocketEvents.OUTBOUND.INITIAL_ANSWER_SUBMISSION, {
                sessionId: session.id,
                optionId: session.answers.initial.optionId,
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
                    // let $answersUL = page$("#answers > ul");
                    let $justification = page$("#justification");
                    let $submitAnswer = page$(".submit-answer-button");
                    let $charAvailable = page$("#char-available");
                    

                    // Force answer when timer runs out
                    section.attachTimerCompleted(() => {
                        let justification = $.trim($justification.val());
                        let optionId: string = page$("#answers > .selected").data("optionId");

                        if (justification.length === 0) {
                            justification = "[NO JUSTIFICATION]";
                        }

                        if (!optionId) {
                            justification = "[DID NOT ANSWER]";
                            optionId = null;
                        }

                        submitInitialAnswer(optionId, justification);
                    });

                    $submitAnswer.on("click", () => {
                        let justification = $.trim($justification.val());
                        let optionId = page$("#answers > .selected").data("optionId");

                        if (justification.length === 0 || !optionId) {
                            alert("You must provide an answer and justification.");
                            return;
                        }

                        if (justification.length > maxJustificationLength) {
                            alert("Justification is too long. Reduce your justification length.");
                            return;
                        }

                        submitInitialAnswer(optionId, justification);
                    });

                    $answers.on("click", "button", (e) => {
                        e.preventDefault();

                        $("button", $answers).removeClass("selected");

                        $(e.currentTarget).addClass("selected");
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
                    page$("#question-reading").html(session.quiz.questionContent);
                    // page$("#question-statement").html(session.quiz.questionStatement);

                    let answerDOMs: JQuery[] = [];
                    session.quiz.questionOptions.forEach((option) => {
                        answerDOMs.push($("<button>").html(option.content).data("optionId", option._id));
                    });

                    $answers.append(answerDOMs);
                });
            },
            onLeave: () => {
                section.unsetActive();
                section.clearTimer();
                section.hideTimer();
            }
        }
    }
