import {MoocchatSession} from "../MoocchatSession";

import {IStateHandler, MoocchatState as STATE} from "../MoocchatStates";

import {ILTIData} from "../../../common/interfaces/ILTIData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIData;

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

                    page$("#start-session").one("click", () => {
                        session.stateMachine.goTo(nextState);
                    });
                });
            },
            onLeave: () => {
                section.unsetActive();
            }
        }
    }
