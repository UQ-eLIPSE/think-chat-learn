import * as $ from "jquery";

import { Conf } from "../../config/Conf";

import { MoocchatSession } from "../MoocchatSession";

import { IStateHandler, MoocchatState as STATE } from "../MoocchatStates";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";

import { MoocchatChat } from "../MoocchatChat";

// import * as AnswerComponents from "../AnswerComponents";

export const DiscussionStateHandler: IStateHandler<STATE> =
    (session: MoocchatSession<STATE>, nextState: STATE = STATE.REVISED_ANSWER) => {
        const section = session.sectionManager.getSection("discussion");

        let typingCheckIntervalHandle: number;
        let typingState: boolean = false;

        return {
            onEnter: (data: IWSToClientData.ChatGroupFormed) => {
                session.pageManager.loadPage("discussion", (page$) => {
                    const $wrapper = page$("#chat-ui-wrapper");

                    const $endChat = page$("#end-chat");
                    const $confirmEndChat = page$("#confirm-end-chat");
                    const $cancelEndChat = page$("#cancel-end-chat");
                    const $endChatConfirmation = page$("#end-chat-confirmation");

                    const $chatBox = page$("#chat-box");
                    const $chatInput = page$("#chat-input");
                    const $chatInputWrapper = page$("#chat-input-wrapper");

                    const $inChatTextBlockContent = page$("#in-chat-text-block-content");

                    const $answers = page$("#answers");
                    const $questionReading = page$("#question-reading");

                    const chat = new MoocchatChat(session, data, $chatBox);
                    const playTone = session.storage.getItem("play-notification-tone") === "true";

                    section.setActive();
                    section.startTimer();

                    session.analytics.trackEvent("CHAT", "START");

                    // Play notification tone
                    if (playTone) {
                        const notificationTone = new Audio("./static/mp3/here-i-am.mp3");
                        notificationTone.play();
                    }

                    // Always reset after playing
                    session.storage.removeItem("play-notification-tone");


                    function endChat() {
                        section.stopTimer();

                        clearInterval(typingCheckIntervalHandle);
                        chat.sendTypingState(false);

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

                        // Update typing state
                        typingState = false;

                        $chatInput.val("").focus();
                    });

                    // Render question and answer choices
                    $questionReading.html(session.quiz.questionContent);

                    // Render in chat text block if question data contains it
                    const inChatTextBlockHtml = session.quiz.questionInChatTextBlock;

                    if (inChatTextBlockHtml) {
                        // Put content in
                        $inChatTextBlockContent.html(inChatTextBlockHtml);

                        // Hide in chat text block if close button clicked
                        page$("section[data-name='discussion']").on("click", "button[data-click-action='toggle-in-chat-text-block']", () => {
                            $wrapper.toggleClass("hide-in-chat-text-block");
                        });
                    } else {
                        // Hide element entirely as there is no content to render
                        $wrapper.addClass("hide-in-chat-text-block");
                        page$("button[data-click-action='toggle-in-chat-text-block']").hide();
                    }

                    // Only present free text answers, not multiple choice ones (which are now confidence rankings to be hidden)
                    const $answerOptElems = data.groupAnswers.map(
                        answer => $("<div>").text(answer.answer.justification)
                    );

                    $answers.append($answerOptElems);

                    // Display system chat messages at top
                    chat.displaySystemMessage(`Your group has ${data.groupSize} member${(data.groupSize !== 1) ? "s" : ""}`, true);
                    chat.displaySystemMessage(`You are Person #${data.clientIndex + 1}`);

                    chat.displaySystemMessage("You can start the chat by looking at group answers on the left.", true, );

                    // Put focus to input field at start of chat so people can get started immediately
                    $chatInput.focus();


                    // Typing notifications
                    typingCheckIntervalHandle = setInterval(() => {
                        const message = $.trim($chatInput.val());

                        if (message.length === 0 && typingState) {
                            // Cleared input
                            typingState = false;
                            chat.sendTypingState(typingState);
                        } else if (message.length > 0 && !typingState) {
                            // Input detected
                            typingState = true;
                            chat.sendTypingState(typingState);
                        }
                    }, Conf.chat.typingNotificationCheckMs);
                });
            },
            onLeave: () => {
                section.unsetActive();
                section.clearTimer();
                section.hideTimer();
            }
        }
    }
