import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {WebsocketManager} from "../classes/WebsocketManager";

import {WebsocketEvents} from "../classes/WebsocketEvents";
import * as IOutboundData from "../classes/IOutboundData";

export const SurveyStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("survey");

        return {
            onEnter: () => {
                session.pageManager.loadPage("survey", (page$) => {
                    section.setActive();

                    const $surveyForm = page$("#survey-form");

                    session.analytics.trackEvent("SURVEY", "START");

                    $surveyForm.on("submit", (e) => {
                        e.preventDefault();

                        // Validate                        
                        $("#form-validation-failure", $surveyForm).remove();

                        let formValid = session.survey.validateForm($surveyForm);

                        if (!formValid) {
                            let $submitButton = $("*[type='submit']", $surveyForm);

                            $("<p>")
                                .prop("id", "form-validation-failure")
                                .addClass("mc-inline-message")
                                .text("Please check your survey form again.")
                                .insertBefore($submitButton);

                            // Force scroll to bottom to reveal the form validation failure message
                            page$().scrollTop(page$().get(0).scrollHeight);

                            return;
                        }

                        // Send survey
                        let surveyResponseContent = session.survey.generateResponseContent($surveyForm);
                        session.socket.emitData<IOutboundData.SurveyResponse>(WebsocketEvents.OUTBOUND.SURVEY_SUBMISSION, {
                            sessionId: session.id,
                            content: surveyResponseContent
                        });

                        session.stateMachine.goTo(STATE.COMPLETION);
                    });

                    // Construct survey form
                    page$("#survey-content").append(session.survey.generateHTML());

                });
            },
            onLeave: () => {
                section.unsetActive();
                session.analytics.trackEvent("SURVEY", "END");
            }
        }
    }
