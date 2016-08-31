import * as $ from "jquery";

import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {WebsocketEvents} from "../classes/WebsocketEvents";
import * as IOutboundData from "../classes/IOutboundData";

import * as AnswerComponents from "../shared/AnswerComponents";

export const InitialAnswerStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("initial-answer");

        const submitInitialAnswerFunc = AnswerComponents.SubmissionFuncFactory(session, "initial", WebsocketEvents.OUTBOUND.INITIAL_ANSWER_SUBMISSION);

        // Successful initial answer save
        session.socket.once(WebsocketEvents.INBOUND.INITIAL_ANSWER_SUBMISSION_SAVED, () => {
            session.stateMachine.goTo(STATE.AWAIT_GROUP_FORMATION);
        });

        return {
            onEnter: () => {
                session.pageManager.loadPage("initial-answer", (page$) => {
                    const $answers = page$("#answers");
                    const $justification = page$("#justification");
                    const $submitAnswer = page$(".submit-answer-button");
                    const $charAvailable = page$("#char-available");
                    const $questionReading = page$("#question-reading");

                    section.setActive();
                    section.startTimer();

                    // Force answer when timer runs out
                    section.attachTimerCompleted(() => {
                        AnswerComponents.ProcessForcedSubmission(
                            AnswerComponents.ExtractOptionId($answers),
                            AnswerComponents.ExtractJustification($justification),
                            submitInitialAnswerFunc);
                    });

                    // Standard answer submission click
                    $submitAnswer.on("click", () => {
                        if (AnswerComponents.ProcessSubmission(
                            AnswerComponents.ExtractOptionId($answers),
                            AnswerComponents.ExtractJustification($justification),
                            submitInitialAnswerFunc)) {

                            // Must stop timer now to prevent duplicate
                            // submissions being triggered by button click
                            // and timer
                            section.stopTimer();
                        }
                    });

                    // Answer multiple choice highlighting
                    $answers.on("click", "button", (e) => {
                        e.preventDefault();
                        $("button", $answers).removeClass("selected");
                        $(e.currentTarget).addClass("selected");
                    });

                    // Update char available
                    $justification.on("change input", () => {
                        AnswerComponents.UpdateJustificationCharAvailable($justification.val(), $charAvailable);
                    }).trigger("input");

                    // Render question and answer choices
                    $questionReading.html(session.quiz.questionContent);
                    $answers.append(AnswerComponents.GenerateAnswerOptionElems(session.quiz.questionOptions));
                });
            },
            onLeave: () => {
                section.unsetActive();
                section.clearTimer();
                section.hideTimer();
            }
        }
    }
