import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

export const NoLtiDataStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                session.pageManager.loadPage("no-lti-data");
            }
        }
    }
