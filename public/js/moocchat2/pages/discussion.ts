import {IPageFunc} from "../IPageFunc";

import {MoocchatState as STATE} from "../MoocchatStates";

export let DiscussionPageFunc: IPageFunc<STATE> =
    (stateMachine, pageManager, secManager) => {
        let section = secManager.getSection("discussion");

        return {
            onEnter: () => {
                pageManager.loadPage("discussion", (page$) => {
                    section.setActive();
                    section.startTimer();

                    page$("#end-chat").on("click", () => {
                        stateMachine.goTo(STATE.REVISED_ANSWER);
                    });



                    let $activeSection = $("[data-active-section]", "#session-sections");
                    let $chatBox = page$("#chat-box");

                    let playTone = sessionStorage.getItem("play-notification-tone") === "true";

                    if (playTone) {
                        let notificationTone = new Audio("./mp3/here-i-am.mp3");
                        notificationTone.play();
                    }

                    sessionStorage.removeItem("play-notification-tone");


                    page$("#toggle-chat-qa-block").click(function() {
                        $("#chat-question-answers-block").toggle();
                    }).click();

                    page$("#chat-input-wrapper").on("submit", function(e) {
                        e.preventDefault();



                        var message = page$("#chat-input").val();

                        var personId = 1;

                        switch (message.substr(0, 1)) {
                            case "2":
                                personId = 2;
                                message = message.substring(1);
                                break;
                            case "3":
                                personId = 3;
                                message = message.substring(1);
                                break;
                            default:
                                personId = 1;
                        }




                        if (message.length === 0) {
                            return;
                        }

                        injectChatMessage(personId, message);

                        page$("#chat-input").val("").focus();
                    });


                    var injectChatMessage = function(personId: number, text: string) {
                        var $message = $("<p>").text(text);

                        var $lastPersonBlock = $("blockquote:last-child", $chatBox);
                        var lastPersonId = $lastPersonBlock.data("person");

                        if (lastPersonId == personId) {
                            $message.appendTo($lastPersonBlock);
                        } else {
                            $("<blockquote>")
                                .attr("data-person", personId)
                                .append($message)
                                .appendTo($chatBox);
                        }

                        $chatBox.scrollTop($chatBox.get(0).scrollHeight);
                    }








                });
            },
            onLeave: () => {
                section.setInactive();
                section.hideTimer();
            }
        }
    }
