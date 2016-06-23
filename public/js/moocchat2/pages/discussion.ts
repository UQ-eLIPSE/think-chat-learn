import {IPageFunc} from "../IPageFunc";

import {MoocchatState as STATE} from "../MoocchatStates";
import {IEventData_ChatGroupFormed} from "../IEventData";

import {MoocchatChat} from "../MoocchatChat";

export let DiscussionPageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("discussion");

        return {
            onEnter: (data: IEventData_ChatGroupFormed) => {
                session.pageManager.loadPage("discussion", (page$) => {
                    section.setActive();
                    section.startTimer();

                    page$("#end-chat").on("click", () => {
                        chat.terminate();
                        session.stateMachine.goTo(STATE.REVISED_ANSWER);
                    });



                    let $activeSection = $("[data-active-section]", "#session-sections");
                    let $chatBox = page$("#chat-box");





                    let playTone = sessionStorage.getItem("play-notification-tone") === "true";

                    if (playTone) {
                        let notificationTone = new Audio("./mp3/here-i-am.mp3");
                        notificationTone.play();
                    }

                    sessionStorage.removeItem("play-notification-tone");




                    // page$("#toggle-chat-qa-block").click(function() {
                    //     $("#chat-question-answers-block").toggle();
                    // }).click();





                    let chat = new MoocchatChat(session, data, $chatBox);

                    page$("#chat-input-wrapper").on("submit", function(e) {
                        e.preventDefault();

                        var message = page$("#chat-input").val();

                        if (message.length === 0) {
                            return;
                        }

                        chat.sendMessage(message);

                        page$("#chat-input").val("").focus();
                    });


                    // Notes at top
                    chat.displayMessage(-1, `Your discussion group has ${data.groupSize} member${(data.groupSize !== 1) ? "s" : " only"}`);
                    chat.displayMessage(-1, `You are Person #${data.clientIndex + 1}`);







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
                section.setInactive();
                section.hideTimer();
            }
        }
    }
