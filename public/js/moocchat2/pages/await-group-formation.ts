import {IPageFunc} from "../IPageFunc";

import {MoocchatState as STATE} from "../MoocchatStates";

export let AwaitGroupFormationPageFunc: IPageFunc<STATE> =
    (stateMachine, pageManager, secManager) => {
        let section = secManager.getSection("discussion");

        return {
            onEnter: () => {
                pageManager.loadPage("await-group-formation", (page$) => {
                    section.setActive();
                    section.setPaused();

                    // TODO: Use incoming chat formation event to progress to next state
                    let waitTime = (Math.random() * 30 * 1000) + (10 * 1000);

                    setTimeout(() => {
                        let playTone = page$("#play-group-formation-tone").is(":checked");
                        sessionStorage.setItem("play-notification-tone", playTone ? "true" : "false");
                        stateMachine.goTo(STATE.DISCUSSION);
                    }, waitTime);
                });
            },
            onLeave: () => {

            }
        }
    }
