import * as $ from "jquery";

import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatSession} from "../classes/MoocchatSession";

import {MoocchatState as STATE} from "../classes/MoocchatStates";
import * as IInboundData from "../classes/IInboundData";

import {MoocchatChat} from "../classes/MoocchatChat";

export const DiscussionStateHandler: IStateHandler<STATE> =
    (session: MoocchatSession<STATE>, nextState: STATE = STATE.REVISED_ANSWER) => {
        const section = session.sectionManager.getSection("discussion");

        return {
            onEnter: (data: IInboundData.ChatGroupFormed) => {
                session.pageManager.loadPage("discussion", (page$) => {
                    section.setActive();
                    section.startTimer();

                    session.analytics.trackEvent("CHAT", "START");

                    let $activeSection = $("[data-active-section]", "#session-sections");
                    let $chatBox = page$("#chat-box");

                    let chat = new MoocchatChat(session, data, $chatBox);

                    function endChat() {
                        chat.terminate();
                        session.analytics.trackEvent("CHAT", "END");

                        // Pass chat object to next state so that it can be used for transcript cloning (in ./revised-answer.ts)
                        session.stateMachine.goTo(nextState, chat);
                    }

                    page$("#end-chat").on("click", () => {
                        page$("#end-chat-confirmation").removeClass("hidden");
                    });

                    page$("#cancel-end-chat").on("click", () => {
                        page$("#end-chat-confirmation").addClass("hidden");
                    });

                    page$("#confirm-end-chat").on("click", () => {
                        endChat();
                    });

                    // End chat when timer runs out
                    section.attachTimerCompleted(() => {
                        endChat();
                    });



                    let playTone = session.storage.getItem("play-notification-tone") === "true";

                    if (playTone) {
                        let notificationTone = new Audio("./mp3/here-i-am.mp3");
                        notificationTone.play();
                    }

                    session.storage.removeItem("play-notification-tone");





                    page$("#chat-input-wrapper").on("submit", (e) => {
                        e.preventDefault();

                        let message = $.trim(page$("#chat-input").val());

                        if (message.length === 0) {
                            return;
                        }

                        chat.sendMessage(message);

                        page$("#chat-input").val("").focus();
                    });


                    // Notes at top
                    chat.displaySystemMessage(`Your discussion group has ${data.groupSize} member${(data.groupSize !== 1) ? "s" : ""}`);
                    chat.displaySystemMessage(`You are Person #${data.clientIndex + 1}`);

                    if (data.groupSize === 1) {
                        chat.displaySystemMessage(`Looks like you're alone.`, true);
                        chat.displaySystemMessage(`Discuss with yourself about how you arrived at your answer and the possibilities of the other options.`);
                    } else {
                        chat.displaySystemMessage(`Talk with your group to develop a better understanding of the question and everyone's reasoning.`, true);
                        chat.displaySystemMessage(`You can find group answers in the answers pane on the left.`);
                    }

                    // data.groupAnswers.forEach((answerData) => {
                    //     chat.displayMessage(answerData.clientIndex + 1, `Answer = ${String.fromCharCode(65 + answerData.answer)}; Justification = ${answerData.justification}`)
                    // });




                    let $answers = page$("#answers");

                    let answerDOMs: JQuery[] = [];

                    // Render question, choices
                    page$("#question-reading").html(session.quiz.questionContent);
                    // page$("#question-statement").html(session.quiz.questionStatement);

                    // Go through each client's answers and add them into the answer choices
                    let answerJustificationMap: { [optionId: string]: { clientIndex: number; justification: string; }[] } = {};

                    data.groupAnswers.forEach((clientAnswer) => {
                        let clientIndex = clientAnswer.clientIndex;

                        let justification = clientAnswer.answer.justification;
                        let optionId = clientAnswer.answer.optionId;

                        if (!answerJustificationMap[optionId]) {
                            answerJustificationMap[optionId] = [];
                        }

                        answerJustificationMap[optionId].push({
                            clientIndex: clientIndex,
                            justification: justification
                        });
                    });

                    session.quiz.questionOptions.forEach((option) => {
                        let $answer = $("<div>").html(option.content);

                        if (answerJustificationMap[option._id]) {
                            let $clientAnswerBlockUL = $("<ul>").prop("id", "client-justifications");

                            answerJustificationMap[option._id].forEach((clientJustification) => {
                                $("<li>")
                                    .attr("data-client-id", clientJustification.clientIndex + 1)
                                    .text(clientJustification.justification)
                                    .appendTo($clientAnswerBlockUL);
                            });

                            $clientAnswerBlockUL.appendTo($answer);
                        }

                        answerDOMs.push($answer);
                    });

                    $answers.append(answerDOMs);


                    page$("#chat-input").focus();
                });
            },
            onLeave: () => {
                section.unsetActive();
                section.clearTimer();
                section.hideTimer();
            }
        }
    }
