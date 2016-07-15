import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {ILTIBasicLaunchData} from "../classes/ILTIBasicLaunchData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

export const BackupClientEjectedStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                // Log out by closing socket
                session.socket.close();
                
                session.pageManager.loadPage("backup-client-ejected", (page$) => {
                    // page$("#login-again").on("click", () => {
                    //     session.socket.open();
                    //     session.stateMachine.goTo(STATE.LOGIN);
                    // });

                    page$("#go-to-return-url").on("click", () => {
                        window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                    });
                });
            }
        }
    }
