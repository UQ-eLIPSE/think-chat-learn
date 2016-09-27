import {IStateHandler, MoocchatState as STATE} from "../MoocchatStates";

import * as IWSToServerData from "../../../common/interfaces/IWSToServerData";
import {WebsocketEvents} from "../WebsocketEvents";

export const SetResearchConsentStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                session.socket.once(WebsocketEvents.INBOUND.LOGIN_RESEARCH_CONSENT_SAVED, () => {
                    session.stateMachine.goTo(STATE.WELCOME);
                });

                session.socket.emitData<IWSToServerData.LoginResearchConsent>(WebsocketEvents.OUTBOUND.LOGIN_RESEARCH_CONSENT_SET, {
                    sessionId: session.id,
                    researchConsent: session.consent
                });
            }
        }
    }
