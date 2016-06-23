import {IPageFunc} from "../IPageFunc";

import {MoocchatState as STATE} from "../MoocchatStates";

export let SurveyPageFunc: IPageFunc<STATE> =
    (stateMachine, pageManager, secManager) => {
        let section = secManager.getSection("survey");

        return {
            onEnter: () => {
                pageManager.loadPage("survey", (page$) => {
                    section.setActive();
                });
            },
            onLeave: () => {
                section.setInactive();
            }
        }
    }
