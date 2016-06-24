import {IPageFunc} from "../IPageFunc";

import {MoocchatState as STATE} from "../MoocchatStates";

export let SurveyPageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("survey");

        return {
            onEnter: () => {
                session.pageManager.loadPage("survey", (page$) => {
                    section.setActive();
                });
            },
            onLeave: () => {
                section.unsetActive();
            }
        }
    }
