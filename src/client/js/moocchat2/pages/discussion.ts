import * as $ from "jquery";

import {IPageFunc} from "../classes/IPageFunc";

import {MoocchatState as STATE} from "../classes/MoocchatStates";
import {IEventData_ChatGroupFormed} from "../classes/IEventData";

import {MoocchatChat} from "../classes/MoocchatChat";

export let DiscussionPageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("discussion");

        return {
            onEnter: (data: IEventData_ChatGroupFormed) => {
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
                        session.stateMachine.goTo(STATE.REVISED_ANSWER);
                    }

                    page$("#end-chat").on("click", () => {
                        endChat();
                    });

                    // End chat when timer runs out
                    section.attachTimerCompleted(() => {
                        endChat();
                    });



                    let playTone = sessionStorage.getItem("play-notification-tone") === "true";

                    if (playTone) {
                        let notificationTone = new Audio("./mp3/here-i-am.mp3");
                        notificationTone.play();
                    }

                    sessionStorage.removeItem("play-notification-tone");




                    // page$("#toggle-chat-qa-block").click(function() {
                    //     $("#chat-question-answers-block").toggle();
                    // }).click();






                    page$("#chat-input-wrapper").on("submit", function(e) {
                        e.preventDefault();

                        var message = $.trim(page$("#chat-input").val());

                        if (message.length === 0) {
                            return;
                        }

                        chat.sendMessage(message);

                        page$("#chat-input").val("").focus();
                    });


                    // Notes at top
                    chat.displaySystemMessage(`Your discussion group has ${data.groupSize} member${(data.groupSize !== 1) ? "s" : " only"}`);
                    chat.displaySystemMessage(`You are Person #${data.clientIndex + 1}`);

                    data.groupAnswers.forEach((answerData) => {
                        chat.displayMessage(answerData.clientIndex + 1, `Answer = ${String.fromCharCode(65 + answerData.answer)}; Justification = ${answerData.justification}`)
                    });




                    let $answersUL = page$("#chat-answers > ul");

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
