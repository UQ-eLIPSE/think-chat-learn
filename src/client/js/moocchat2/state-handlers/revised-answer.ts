import {conf} from "../conf";

import * as $ from "jquery";

import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {MoocchatChat} from "../classes/MoocchatChat";

import {WebsocketEvents} from "../classes/Websockets";

export const RevisedAnswerStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("revised-answer");
        const maxJustificationLength = conf.answers.justification.maxLength;

        function submitRevisedAnswer(optionId: string, justification: string) {
            session.answers.revised.optionId = optionId;
            session.answers.revised.justification = justification.substr(0, maxJustificationLength);

            session.socket.emit(WebsocketEvents.OUTBOUND.REVISED_ANSWER_SUBMISSION, {
                sessionId: session.id,
                optionId: session.answers.revised.optionId,
                justification: session.answers.revised.justification
            });

            session.stateMachine.goTo(STATE.SURVEY);
        }

        return {
            onEnter: (data) => {
                session.pageManager.loadPage("revised-answer", (page$) => {
                    section.setActive();
                    section.startTimer();

                    let $answers = page$("#answers");
                    // let $answersUL = page$("#answers > ul");
                    let $justification = page$("#justification");
                    let $submitAnswer = page$(".submit-answer-button");
                    let $charAvailable = page$("#char-available");
                    let $enableRevision = page$("#enable-revision");
                    let $showQuestionChat = page$("#show-hide-question-chat");

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

                        submitRevisedAnswer(optionId, justification);
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

                        submitRevisedAnswer(optionId, justification);
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

                    $enableRevision.on("click", () => {
                        page$(".pre-edit-enable").hide();
                        page$(".post-edit-enable").show();
                        $answers.removeClass("locked");
                        $justification.prop("disabled", false).trigger("input");

                        $answers.on("click", "button", function(e) {
                            e.preventDefault();

                            $("button", $answers).removeClass("selected");

                            $(this).addClass("selected");

                        });
                    });

                    $showQuestionChat.on("click", () => {
                        page$("#question-chat-container").toggle();
                    });
                    page$("#question-chat-container").hide();

                    // Render question, choices
                    page$("#question-reading").html(session.quiz.questionContent);
                    // page$("#question-statement").html(session.quiz.questionStatement);

                    let answerDOMs: JQuery[] = [];
                    session.quiz.questionOptions.forEach((option) => {
                        answerDOMs.push($("<button>").html(option.content).data("optionId", option._id));
                    });

                    $answers.append(answerDOMs);


                    // Populate previous answer
                    $justification.val(session.answers.initial.justification);
                    $("button", $answers).each((i, e) => {
                        if ($(e).data("optionId") === session.answers.initial.optionId) {
                            $(e).addClass("selected");
                            return false;
                        }
                    });


                    // Set pre-/post-edit-enable elements
                    $justification.prop("disabled", true);
                    page$(".post-edit-enable").hide();
                    $answers.addClass("locked");

                    // If passed chat object, clone window into expected chat area
                    if (data instanceof MoocchatChat) {
                        let chat = data as MoocchatChat;

                        page$("#chat-clone").append(chat.chatWindow);
                    }
                });
            },
            onLeave: () => {
                section.unsetActive();
                section.clearTimer();
                section.hideTimer();
            }
        }
    }
