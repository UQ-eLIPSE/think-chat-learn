import * as $ from "jquery";

import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatSession} from "../classes/MoocchatSession";

import {MoocchatState as STATE} from "../classes/MoocchatStates";
import * as IInboundData from "../classes/IInboundData";

import {MoocchatChat} from "../classes/MoocchatChat";

import * as AnswerComponents from "../shared/AnswerComponents";

export const DiscussionStateHandler: IStateHandler<STATE> =
    (session: MoocchatSession<STATE>, nextState: STATE = STATE.REVISED_ANSWER) => {
        const section = session.sectionManager.getSection("discussion");

        return {
            onEnter: (data: IInboundData.ChatGroupFormed) => {
                session.pageManager.loadPage("discussion", (page$) => {
                    const $endChat = page$("#end-chat");
                    const $confirmEndChat = page$("#confirm-end-chat");
                    const $cancelEndChat = page$("#cancel-end-chat");
                    const $endChatConfirmation = page$("#end-chat-confirmation");

                    const $chatBox = page$("#chat-box");
                    const $chatInput = page$("#chat-input");
                    const $chatInputWrapper = page$("#chat-input-wrapper");

                    const $answers = page$("#answers");
                    const $questionReading = page$("#question-reading");

                    const chat = new MoocchatChat(session, data, $chatBox);
                    const playTone = session.storage.getItem("play-notification-tone") === "true";

                    section.setActive();
                    section.startTimer();

                    session.analytics.trackEvent("CHAT", "START");

                    // Play notification tone
                    if (playTone) {
                        const notificationTone = new Audio("./mp3/here-i-am.mp3");
                        notificationTone.play();
                    }

                    // Always reset after playing
                    session.storage.removeItem("play-notification-tone");


                    function endChat() {
                        chat.terminate();
                        session.analytics.trackEvent("CHAT", "END");

                        // Pass chat object to next state so that it can be used for transcript cloning (in ./revised-answer.ts)
                        session.stateMachine.goTo(nextState, chat);
                    }

                    $endChat.on("click", () => {
                        $endChatConfirmation.removeClass("hidden");
                    });

                    $cancelEndChat.on("click", () => {
                        $endChatConfirmation.addClass("hidden");
                    });

                    $confirmEndChat.on("click", () => {
                        endChat();
                    });

                    // End chat when timer runs out
                    section.attachTimerCompleted(() => {
                        endChat();
                    });

                    // Chat input form submission = On clicking "send" or hitting ENTER
                    $chatInputWrapper.on("submit", (e) => {
                        e.preventDefault();

                        const message = $.trim($chatInput.val());

                        if (message.length === 0) {
                            return;
                        }

                        chat.sendMessage(message);

                        $chatInput.val("").focus();
                    });

                    // Render question and answer choices
                    $questionReading.html(session.quiz.questionContent);

                    const $answerOptElems = AnswerComponents.GenerateAnswerOptionElems(session.quiz.questionOptions, "<div>");

                    // Go through each client's answers and add them into the answer choices
                    const answerJustificationMap: { [optionId: string]: { clientIndex: number; justification: string; }[] } = {};

                    data.groupAnswers.forEach((clientAnswer) => {
                        const clientIndex = clientAnswer.clientIndex;

                        const justification = clientAnswer.answer.justification;
                        const optionId = clientAnswer.answer.optionId;

                        if (!answerJustificationMap[optionId]) {
                            answerJustificationMap[optionId] = [];
                        }

                        answerJustificationMap[optionId].push({
                            clientIndex: clientIndex,
                            justification: justification
                        });
                    });

                    $answerOptElems.forEach(($answerListElem) => {
                        const optionId = $answerListElem.data("optionId") as string;

                        if (answerJustificationMap[optionId]) {
                            const $clientAnswerBlockUL = $("<ul>").addClass("client-justifications");

                            answerJustificationMap[optionId].forEach((clientJustification) => {
                                $("<li>")
                                    .attr("data-client-id", clientJustification.clientIndex + 1)
                                    .text(clientJustification.justification)
                                    .appendTo($clientAnswerBlockUL);
                            });

                            $clientAnswerBlockUL.appendTo($answerListElem);
                        }
                    });

                    $answers.append($answerOptElems);

                    // Display system chat messages at top
                    chat.displaySystemMessage(`Your discussion group has ${data.groupSize} member${(data.groupSize !== 1) ? "s" : ""}`);
                    chat.displaySystemMessage(`You are Person #${data.clientIndex + 1}`);

                    if (data.groupSize === 1) {
                        chat.displaySystemMessage("Looks like you're alone.", true);
                        chat.displaySystemMessage("Discuss with yourself about how you arrived at your answer and the possibilities of the other options.");
                    } else {
                        chat.displaySystemMessage("Talk with your group to develop a better understanding of the question and everyone's reasoning.", true);
                        chat.displaySystemMessage("You can find group answers in the answers pane on the left.");
                    }

                    // Put focus to input field at start of chat so people can get started immediately
                    $chatInput.focus();
                });
            },
            onLeave: () => {
                section.unsetActive();
                section.clearTimer();
                section.hideTimer();
            }
        }
    }
