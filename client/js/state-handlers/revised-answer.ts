import * as $ from "jquery";

import {IStateHandler, MoocchatState as STATE} from "../MoocchatStates";

import {MoocchatChat} from "../MoocchatChat";

import {WebsocketEvents} from "../WebsocketEvents";

import * as AnswerComponents from "../AnswerComponents";

export const RevisedAnswerStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("revised-answer");

        const submitRevisedAnswerFunc = AnswerComponents.SubmissionFuncFactory(session, "revised", WebsocketEvents.OUTBOUND.REVISED_ANSWER_SUBMISSION);

        // Successful revised answer save
        session.socket.once(WebsocketEvents.INBOUND.REVISED_ANSWER_SUBMISSION_SAVED, () => {
            session.stateMachine.goTo(STATE.SURVEY);
        });

        let onWindowResize: () => any | undefined;
        let onWindowResizeTimeout: number | undefined;

        return {
            onEnter: (data) => {
                session.pageManager.loadPage("revised-answer", (page$) => {
                    const $answers = page$("#answers");
                    const $justification = page$("#justification");
                    const $initialJustification = page$("#initial-justification");
                    const $submitAnswer = page$(".submit-answer-button");
                    const $charAvailable = page$("#char-available");
                    const $questionReading = page$("#question-reading");
                    // const $enableRevision = page$("#enable-revision");
                    const $questionChatSection = page$("#question-chat-container");
                    const $showQuestionChat = page$("#show-hide-question-chat");

                    section.setActive();
                    section.startTimer();

                    // Force answer when timer runs out
                    section.attachTimerCompleted(() => {
                        AnswerComponents.ProcessForcedSubmission(
                            AnswerComponents.ExtractOptionId($answers),
                            AnswerComponents.ExtractJustification($justification),
                            submitRevisedAnswerFunc);
                    });

                    // Standard answer submission click
                    $submitAnswer.on("click", () => {
                        if (AnswerComponents.ProcessSubmission(
                            AnswerComponents.ExtractOptionId($answers),
                            AnswerComponents.ExtractJustification($justification),
                            submitRevisedAnswerFunc)) {

                            // Must stop timer now to prevent duplicate
                            // submissions being triggered by button click
                            // and timer
                            section.stopTimer();
                        }
                    });

                    // Update char available
                    $justification.on("change input", () => {
                        AnswerComponents.UpdateJustificationCharAvailable($justification.val(), $charAvailable);
                    }).trigger("input");

                    // // Answer multiple choice highlighting
                    // $enableRevision.on("click", () => {
                    //     page$(".pre-edit-enable").hide();
                    //     page$(".post-edit-enable").show();
                    //     $justification.prop("disabled", false).trigger("input");

                        $answers.on("click", (e) => {
                            const $el = $(e.target);

                            // Make sure the element we're getting the
                            // click event from is the immediate child
                            if (!$el.parent().is($answers)) {
                                return;
                            }

                            e.preventDefault();
                            $answers.children().removeClass("selected");
                            $el.addClass("selected");
                        }).removeClass("locked");
                    // });

                    // Toggle question+chat section
                    $showQuestionChat.on("click", () => {
                        $questionChatSection.toggle();
                    });

                    // Hide question+chat section by default
                    $questionChatSection.hide();

                    // Render question and answer choices
                    $questionReading.html(session.quiz.questionContent);
                    $answers.append(AnswerComponents.GenerateAnswerOptionElems(session.quiz.questionOptions));
                
                    // // Populate previous answer
                    $initialJustification.val(session.answers.initial.justification);
                    // $("button", $answers).each((i, elem) => {
                    //     if ($(elem).data("optionId") === session.answers.initial.optionId) {
                    //         $(elem).addClass("selected");
                    //         return false;
                    //     }
                    //     return undefined;
                    // });

                    // // Set pre-/post-edit-enable elements
                    $initialJustification.prop("disabled", true);
                    // page$(".post-edit-enable").hide();
                    // $answers.addClass("locked");

                    // If passed chat object, clone window into expected chat area
                    if (data instanceof MoocchatChat) {
                        const chat = data as MoocchatChat;
                        page$("#chat-clone").append(chat.chatWindow);
                    }


                    // [Firefox] Fix for #answers.scale-layout item widths being inconsistent
                    // This is due to ::first-letter and the scaling of the font size
                    if ($answers.hasClass("scale-layout")) {
                        // Apply first-letter-fix class then remove after a short period
                        // This needs to be applied on window resize
                        $(window).on("resize", onWindowResize = () => {
                            $answers.addClass("first-letter-fix");
                            
                            // Clear out any existing timeout before setting this timeout
                            clearTimeout(onWindowResizeTimeout);
                            onWindowResizeTimeout = setTimeout(() => {
                                $answers.removeClass("first-letter-fix");
                            }, 1);
                        }).trigger("resize");
                    }
                });
            },
            onLeave: () => {
                section.unsetActive();
                section.clearTimer();
                section.hideTimer();

                $(window).off("resize", onWindowResize);
            }
        }
    }
