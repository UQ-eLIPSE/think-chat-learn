import {IStateHandler, MoocchatState as STATE} from "../MoocchatStates";

export const NoLtiDataStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                session.pageManager.loadPage("no-lti-data");
                session.socket.close();
            }
        }
    }
