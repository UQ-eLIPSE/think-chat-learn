import {conf} from "../conf";

import * as $ from "jquery";

import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {WebsocketEvents} from "../classes/WebsocketEvents";
import * as IInboundData from "../classes/IInboundData";
import * as IOutboundData from "../classes/IOutboundData";

export const BackupClientAnswerStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("backup-client-answer");
        const maxJustificationLength = conf.answers.justification.maxLength;

        function submitAnswerAndJoinQueue(optionId: string, justification: string) {
            session.answers.initial.optionId = optionId;
            session.answers.initial.justification = justification.substr(0, maxJustificationLength);

            session.socket.emitData<IOutboundData.BackupClientAnswer>(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_ANSWER_AND_JOIN_QUEUE, {
                sessionId: session.id,
                optionId: session.answers.initial.optionId,
                justification: session.answers.initial.justification
            });
        }

        // Successful backup client answer save
        session.socket.once<IInboundData.BackupClientEnterQueueState>(WebsocketEvents.INBOUND.BACKUP_CLIENT_ENTER_QUEUE_STATE, (data) => {
            if (data.success) {
                session.stateMachine.goTo(STATE.BACKUP_CLIENT_WAIT);
            }
        });

        return {
            onEnter: () => {
                // Reuse initial answer page for backup queue answer submission
                session.pageManager.loadPage("initial-answer", (page$) => {
                    section.setActive();

                    let $answers = page$("#answers");
                    // let $answersUL = page$("#answers > ul");
                    let $justification = page$("#justification");
                    let $submitAnswer = page$(".submit-answer-button");
                    let $charAvailable = page$("#char-available");

                    $submitAnswer.on("click", () => {
                        let justification = $.trim($justification.val());
                        let optionId: string = page$("#answers > .selected").data("optionId");

                        if (justification.length === 0 || !optionId) {
                            alert("You must provide an answer and justification.");
                            return;
                        }

                        if (justification.length > maxJustificationLength) {
                            alert("Justification is too long. Reduce your justification length.");
                            return;
                        }

                        submitAnswerAndJoinQueue(optionId, justification);
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
            }
        }
    }
