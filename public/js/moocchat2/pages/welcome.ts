import {IPageFunc} from "../IPageFunc";

import {MoocchatState as STATE} from "../MoocchatStates";

export let WelcomePageFunc: IPageFunc<STATE> =
    (stateMachine, pageManager, secManager) => {
        let section = secManager.getSection("welcome");

        return {
            onEnter: () => {
                pageManager.loadPage("welcome", (page$) => {
                    section.setActive();
                    page$("button").on("click", () => {
                        stateMachine.goTo(STATE.INITIAL_ANSWER);
                    });

                    page$("a").on("click", () => {
                        stateMachine.goTo(STATE.DISCUSSION);
                    })
                });
            },
            onLeave: () => {
                section.setInactive();
            }
        }
    }
