import {IPageFunc} from "../classes/IPageFunc";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {ILTIBasicLaunchData} from "../classes/ILTIBasicLaunchData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

export let WelcomePageFunc: IPageFunc<STATE> =
    (session) => {
        let section = session.sectionManager.getSection("welcome");

        return {
            onEnter: (data) => {
                session.pageManager.loadPage("welcome", (page$) => {
                    section.setActive();

                    // Fill in the name
                    page$("#name").text(_LTI_BASIC_LAUNCH_DATA.lis_person_name_full);

                    page$("#not-you-help-link").on("click", (e) => {
                        e.preventDefault();

                        page$("#not-you-help").toggle();
                    }).trigger("click");

                    page$("#start-session").on("click", () => {
                        let nextState: STATE;

                        if (data && data.nextState) {
                            nextState = data.nextState;
                        } else {
                            nextState = STATE.INITIAL_ANSWER;
                        }

                        session.stateMachine.goTo(nextState);
                    });
                });
            },
            onLeave: () => {
                section.unsetActive();
            }
        }
    }
