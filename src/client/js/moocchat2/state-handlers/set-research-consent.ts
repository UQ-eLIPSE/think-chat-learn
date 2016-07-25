import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import * as IOutboundData from "../classes/IOutboundData";
import {WebsocketEvents} from "../classes/WebsocketEvents";

export const SetResearchConsentStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                session.socket.once(WebsocketEvents.INBOUND.LOGIN_RESEARCH_CONSENT_SAVED, () => {
                    session.stateMachine.goTo(STATE.WELCOME);
                });

                session.socket.emitData<IOutboundData.LoginResearchConsent>(WebsocketEvents.OUTBOUND.LOGIN_RESEARCH_CONSENT_SET, {
                    sessionId: session.id,
                    researchConsent: session.consent
                });
            }
        }
    }
