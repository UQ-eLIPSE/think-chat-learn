import {conf} from "../conf";

import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {ILTIBasicLaunchData} from "../classes/ILTIBasicLaunchData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

export const BackupClientEjectedStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                // Log out now
                session.logout(() => {
                    setTimeout(() => {
                        session.socket.close();
                    }, conf.websockets.disconnectCooloffTimeoutMs);
                });

                session.pageManager.loadPage("backup-client-ejected", (page$) => {
                    page$("#go-to-return-url").on("click", () => {
                        window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                    });
                });
            }
        }
    }
