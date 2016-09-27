import {IStateHandler, MoocchatState as STATE} from "../MoocchatStates";

import {MoocchatSession} from "../MoocchatSession";

import {MoocchatUser} from "../MoocchatUser";
import {MoocchatQuiz} from "../MoocchatQuiz";
import {MoocchatSurvey} from "../MoocchatSurvey";

import {ILTIData} from "../../../common/interfaces/ILTIData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIData;

export const LoginStateHandler: IStateHandler<STATE> =
    (session: MoocchatSession<STATE>, nextState: STATE, researchConsentRequiredNextState: STATE) => {
        return {
            onEnter: () => {
                const user = new MoocchatUser(session.eventManager, _LTI_BASIC_LAUNCH_DATA);

                user.onLoginSuccess = (data) => {
                    user.clearLoginCallbacks();

                    session
                        .setId(data.sessionId)
                        .setQuiz(new MoocchatQuiz(data.quiz))
                        .setSurvey(new MoocchatSurvey(data.survey))
                        .setUser(user);

                    if (data.researchConsentRequired) {
                        session.stateMachine.goTo(researchConsentRequiredNextState);
                    } else {
                        session.stateMachine.goTo(nextState);
                    }
                }

                user.onLoginFail = (data) => {
                    user.clearLoginCallbacks();
                    
                    let reason: string;

                    if (typeof data === "string") {
                        // General login failure
                        reason = data;
                    } else {
                        // Login failed because user still signed in
                        reason = `User "${data.username}" is still signed in`;
                    }

                    session.stateMachine.goTo(STATE.INVALID_LOGIN, { reason: reason });
                }

                user.login(session.socket);
            }
        }
    }
