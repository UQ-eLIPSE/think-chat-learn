import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

export const ConsentFormStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                session.pageManager.loadPage("consent-form", (page$) => {
                    page$("#participant-info-sheet").on("click", () => {
                        window.open("/pdf/ENGG1200%20MOOCchat%20Participant%20Information%20Sheet.pdf");
                    });

                    // NOTE:    Both #decline and #accept are in regards to participation in the research study only.
                    //          ** MOOCchat will launch either way. **

                    page$("#decline").on("click", () => {
                        session.setConsent(false);
                        session.stateMachine.goTo(STATE.SET_RESEARCH_CONSENT);
                    });

                    page$("#accept").on("click", () => {
                        session.setConsent(true);
                        session.stateMachine.goTo(STATE.SET_RESEARCH_CONSENT);
                    });
                });
            }
        }
    }
