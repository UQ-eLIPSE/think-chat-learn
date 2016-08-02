import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

export const InvalidLoginStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: (data) => {
                session.pageManager.loadPage("invalid-login", (page$) => {
                    page$("#reason").text(data.reason);
                });

                // End session by closing socket
                // session.socket.close(true);
                session.socket.close();
            }
        }
    }
