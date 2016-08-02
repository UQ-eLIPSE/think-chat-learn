import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

export const NoLtiDataStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                session.pageManager.loadPage("no-lti-data");

                // End session by closing socket
                // session.socket.close(true);
                session.socket.close();
            }
        }
    }
