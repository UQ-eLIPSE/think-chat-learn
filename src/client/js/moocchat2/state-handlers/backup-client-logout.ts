import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {ILTIBasicLaunchData} from "../classes/ILTIBasicLaunchData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIBasicLaunchData;

export const BackupClientLogoutStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("backup-client-logout");

        return {
            onEnter: () => {
                // Log out now
                session.logout(() => {
                    setTimeout(() => {
                        session.socket.close();
                    }, 500);
                });

                session.pageManager.loadPage("backup-client-logout", (page$) => {
                    section.setActive();
                    page$("#go-to-return-url").on("click", () => {
                        window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                    });
                });
            }
        }
    }
