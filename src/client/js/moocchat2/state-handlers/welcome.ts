import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatSession} from "../classes/MoocchatSession";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {ILTIBasicLaunchData} from "../classes/ILTIBasicLaunchData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

export const WelcomeStateHandler: IStateHandler<STATE> =
    (session: MoocchatSession<STATE>, nextState: STATE = STATE.INITIAL_ANSWER) => {
        const section = session.sectionManager.getSection("welcome");

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

                    page$("#start-session").on("click", () => {
                        session.stateMachine.goTo(nextState);
                    });
                });
            },
            onLeave: () => {
                section.unsetActive();
            }
        }
    }
