import {IPageFunc} from "../classes/IPageFunc";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

export let SurveyPageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("survey");

        return {
            onEnter: () => {
                session.pageManager.loadPage("survey", (page$) => {
                    section.setActive();

                    const $surveyForm = page$("#survey-form");

                    session.analytics.trackEvent("SURVEY", "START");

                    $surveyForm.on("submit", (e) => {
                        e.preventDefault();
                        
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

                        // TODO: Send survey

                        // Once survey submitted, continue
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
