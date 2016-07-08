import {IPageFunc} from "../classes/IPageFunc";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

export let SurveyPageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("survey");

        return {
            onEnter: () => {
                session.pageManager.loadPage("survey", (page$) => {
                    section.setActive();

                    session.analytics.trackEvent("SURVEY", "START");

                    page$("#survey-form").on("submit", (e) => {
                        e.preventDefault();
                        session.stateMachine.goTo(STATE.COMPLETION);
                    });
                });
            },
            onLeave: () => {
                section.unsetActive();
                session.analytics.trackEvent("SURVEY", "END");
            }
        }
    }
