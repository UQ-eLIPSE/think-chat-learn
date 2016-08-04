import {IStateHandler} from "../classes/IStateHandler";
import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {MoocchatSession} from "../classes/MoocchatSession";

import {MoocchatUser} from "../classes/MoocchatUser";
import {MoocchatQuiz} from "../classes/MoocchatQuiz";
import {MoocchatSurvey} from "../classes/MoocchatSurvey";

import {ILTIBasicLaunchData} from "../classes/ILTIBasicLaunchData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

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
