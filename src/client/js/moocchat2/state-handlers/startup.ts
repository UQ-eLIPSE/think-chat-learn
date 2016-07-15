import * as $ from "jquery";

import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatSession} from "../classes/MoocchatSession";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {ILTIBasicLaunchData} from "../classes/ILTIBasicLaunchData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

export const StartupStateHandler: IStateHandler<STATE> =
    (session: MoocchatSession<STATE>, $courseNameElem: JQuery, isBackupClient: boolean = false) => {
        return {
            onEnter: () => {
                let courseName = _LTI_BASIC_LAUNCH_DATA.context_id.split("_")[0];

                if (typeof _LTI_BASIC_LAUNCH_DATA === "undefined") {
                    // No LTI data detected
                    session.stateMachine.goTo(STATE.NO_LTI_DATA);
                    session.analytics.trackEvent("MOOCCHAT", "NO_LTI_DATA");
                } else {
                    $courseNameElem.text(courseName + ((isBackupClient) ? " Backup Queue" : ""));
                    session.stateMachine.goTo(STATE.LOGIN);
                    session.analytics.trackEvent("MOOCCHAT", "START");
                }
            }
        }
    }
