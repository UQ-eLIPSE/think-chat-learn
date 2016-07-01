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

                });
            },
            onLeave: () => {
                section.unsetActive();
                session.analytics.trackEvent("SURVEY", "END");
            }
        }
    }
