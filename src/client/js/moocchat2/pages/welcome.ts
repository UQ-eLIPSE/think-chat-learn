import {IPageFunc} from "../classes/IPageFunc";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {ILTIBasicLaunchData} from "../classes/ILTIBasicLaunchData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

export let WelcomePageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("welcome");

        return {
            onEnter: () => {
                session.pageManager.loadPage("welcome", (page$) => {
                    section.setActive();

                    // Fill in the name
                    page$("#name").text(_LTI_BASIC_LAUNCH_DATA.lis_person_name_full);

                    page$("#not-you-help-link").on("click", (e) => {
                        e.preventDefault();

                        page$("#not-you-help").toggle();
                    }).trigger("click");

                    page$("button").on("click", () => {
                        session.stateMachine.goTo(STATE.INITIAL_ANSWER);
                    });
                });
            },
            onLeave: () => {
                section.unsetActive();
            }
        }
    }
