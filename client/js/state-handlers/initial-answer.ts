import * as $ from "jquery";

import { IStateHandler, MoocchatState as STATE } from "../MoocchatStates";

import { WebsocketEvents } from "../WebsocketEvents";

import * as AnswerComponents from "../AnswerComponents";

export const InitialAnswerStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("initial-answer");

        const submitInitialAnswerFunc = AnswerComponents.SubmissionFuncFactory(session, "initial", WebsocketEvents.OUTBOUND.INITIAL_ANSWER_SUBMISSION);

        // Successful initial answer save
        session.socket.once(WebsocketEvents.INBOUND.INITIAL_ANSWER_SUBMISSION_SAVED, () => {
            session.stateMachine.goTo(STATE.AWAIT_GROUP_FORMATION);
        });

        let onWindowResize: () => any | undefined;
        let onWindowResizeTimeout: number | undefined;

        return {
            onEnter: () => {
                session.pageManager.loadPage("initial-answer", (page$) => {
                    const $answers = page$("#answers");
                    const $justification = page$("#justification");
                    const $submitAnswer = page$(".submit-answer-button");
                    const $charAvailable = page$("#char-available");
                    const $questionReading = page$("#question-reading");

                    section.setActive();
                    section.startTimer();

                    // Force answer when timer runs out
                    section.attachTimerCompleted(() => {
                        AnswerComponents.ProcessForcedSubmission(
                            AnswerComponents.ExtractOptionId($answers),
                            AnswerComponents.ExtractJustification($justification),
                            submitInitialAnswerFunc);
                    });

                    // Standard answer submission click
                    $submitAnswer.on("click", () => {
                        if (AnswerComponents.ProcessSubmission(
                            AnswerComponents.ExtractOptionId($answers),
                            AnswerComponents.ExtractJustification($justification),
                            submitInitialAnswerFunc)) {

                            // Must stop timer now to prevent duplicate
                            // submissions being triggered by button click
                            // and timer
                            section.stopTimer();
                        }
                    });

                    // Answer multiple choice highlighting
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
                    });

                    // Update char available
                    $justification.on("change input", () => {
                        AnswerComponents.UpdateJustificationCharAvailable($justification.val(), $charAvailable);
                    }).trigger("input");

                    // Render question and answer choices
                    $questionReading.html(session.quiz.questionContent);
                    $answers.append(AnswerComponents.GenerateAnswerOptionElems(session.quiz.questionOptions));

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
