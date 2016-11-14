import * as $ from "jquery";

import {IStateHandler, MoocchatState as STATE} from "../MoocchatStates";

import {WebsocketEvents} from "../WebsocketEvents";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";

import * as AnswerComponents from "../AnswerComponents";

export const BackupClientAnswerStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("backup-client-answer");

        const submitAnswerAndJoinQueue = AnswerComponents.SubmissionFuncFactory(session, "initial", WebsocketEvents.OUTBOUND.BACKUP_CLIENT_ANSWER_AND_JOIN_QUEUE);

        // Successful backup client answer save
        session.socket.once<IWSToClientData.BackupClientEnterQueueState>(WebsocketEvents.INBOUND.BACKUP_CLIENT_ENTER_QUEUE_STATE, (data) => {
            if (data.success) {
                session.setQuizAttemptId(data.quizAttemptId);
                session.stateMachine.goTo(STATE.BACKUP_CLIENT_WAIT);
            }
        });

        return {
            onEnter: () => {
                // Reuse initial answer page for backup queue answer submission
                session.pageManager.loadPage("initial-answer", (page$) => {
                    const $answers = page$("#answers");
                    const $justification = page$("#justification");
                    const $submitAnswer = page$(".submit-answer-button");
                    const $charAvailable = page$("#char-available");
                    const $questionReading = page$("#question-reading");

                    section.setActive();

                    // Standard answer submission click
                    $submitAnswer.on("click", () => {
                        AnswerComponents.ProcessSubmission(
                            AnswerComponents.ExtractOptionId($answers),
                            AnswerComponents.ExtractJustification($justification),
                            submitAnswerAndJoinQueue);
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
            }
        }
    }
