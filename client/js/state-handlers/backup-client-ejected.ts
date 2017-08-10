import {Conf} from "../../config/Conf";

import {IStateHandler, MoocchatState as STATE} from "../MoocchatStates";

import {ILTIData} from "../../../common/interfaces/ILTIData";

declare const _LTI_BASIC_LAUNCH_DATA: ILTIData;

export const BackupClientEjectedStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                // Log out now
                session.logout(() => {
                    setTimeout(() => {
                        session.socket.close();
                    }, Conf.websockets.disconnectCooloffTimeoutMs);
                });

                session.pageManager.loadPage("backup-client-ejected", (page$) => {
                    page$("#go-to-return-url").one("click", () => {
                        window.top.location.href = _LTI_BASIC_LAUNCH_DATA.launch_presentation_return_url;
                    });
                });
            }
        }
    }
