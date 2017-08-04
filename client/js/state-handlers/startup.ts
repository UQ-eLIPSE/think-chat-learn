import * as $ from "jquery";

import {MoocchatSession} from "../MoocchatSession";

import {IStateHandler, MoocchatState as STATE} from "../MoocchatStates";

import {ILTIData} from "../../../common/interfaces/ILTIData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIData;

export const StartupStateHandler: IStateHandler<STATE> =
    (session: MoocchatSession<STATE>, nextState: STATE, $courseNameElem: JQuery, $blackboardOpen: JQuery, isBackupClient: boolean = false) => {
        return {
            onEnter: () => {
                if (typeof _LTI_BASIC_LAUNCH_DATA === "undefined") {
                    // No LTI data detected
                    session.stateMachine.goTo(STATE.NO_LTI_DATA);
                    session.analytics.trackEvent("MOOCCHAT", "NO_LTI_DATA");
                } else {
                    let courseName: string;

                    // Get course name from context_label first, then try using value in square brackets in title
                    courseName = _LTI_BASIC_LAUNCH_DATA.context_label.split("_")[0];

                    if (courseName.length <= 4) {
                        // http://stackoverflow.com/a/11013275
                        let stringsInSquareBrackets = _LTI_BASIC_LAUNCH_DATA.context_title.match(/[^[\]]+(?=])/g);
                        
                        if (stringsInSquareBrackets) {
                            courseName = stringsInSquareBrackets[0];
                        } else {
                            courseName = "";
                        }
                    }

                    // Make Blackboard link visible and set new window open
                    $("button", $blackboardOpen).on("click", () => {
                        window.open(_LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url);
                    });
                    $blackboardOpen.removeClass("hidden");

                    $courseNameElem.text(courseName + ((isBackupClient) ? " Backup Queue" : ""));
                    
                    session.stateMachine.goTo(nextState);
                    session.analytics.trackEvent("MOOCCHAT", "START");
                }
            }
        }
    }
