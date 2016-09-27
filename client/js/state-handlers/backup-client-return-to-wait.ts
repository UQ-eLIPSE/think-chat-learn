import {IStateHandler, MoocchatState as STATE} from "../MoocchatStates";

import {WebsocketManager} from "../WebsocketManager";
import {WebsocketEvents} from "../WebsocketEvents";

import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../../common/interfaces/IWSToServerData";

export const BackupClientReturnToWaitStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                // Must re-register to return to the queue
                session.socket.once<IWSToClientData.BackupClientEnterQueueState>(WebsocketEvents.INBOUND.BACKUP_CLIENT_ENTER_QUEUE_STATE, (data) => {
                    if (data.success) {
                        session.sectionManager.getSection("discussion").showTimer();
                        session.stateMachine.goTo(STATE.BACKUP_CLIENT_WAIT);
                    }
                });

                session.socket.emitData<IWSToServerData.BackupClientReturnToQueue>(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_RETURN_TO_QUEUE, { sessionId: session.id });
            }
        }
    }
