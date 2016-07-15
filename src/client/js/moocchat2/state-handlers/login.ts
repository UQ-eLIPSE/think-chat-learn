import {IStateHandler} from "../classes/IStateHandler";
import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {MoocchatUser} from "../classes/MoocchatUser";
import {MoocchatQuiz} from "../classes/MoocchatQuiz";
import {MoocchatSurvey} from "../classes/MoocchatSurvey";

import {ILTIBasicLaunchData} from "../classes/ILTIBasicLaunchData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

export const LoginStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                const user = new MoocchatUser(session.eventManager, _LTI_BASIC_LAUNCH_DATA);

                user.onLoginSuccess = (data) => {
                    session
                        .setId(data.sessionId)
                        .setQuiz(new MoocchatQuiz(data.quiz))
                        .setSurvey(new MoocchatSurvey(data.survey))
                        .setUser(user);

                    session.stateMachine.goTo(STATE.WELCOME);
                }

                user.onLoginFail = (data) => {
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
