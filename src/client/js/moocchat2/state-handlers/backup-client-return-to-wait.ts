import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {WebsocketManager} from "../classes/WebsocketManager";
import {WebsocketEvents} from "../classes/WebsocketEvents";

import * as IInboundData from "../classes/IInboundData";
import * as IOutboundData from "../classes/IOutboundData";

export const BackupClientReturnToWaitStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                // Must re-register to return to the queue
                session.socket.once<IInboundData.BackupClientEnterQueueState>(WebsocketEvents.INBOUND.BACKUP_CLIENT_ENTER_QUEUE_STATE, (data) => {
                    if (data.success) {
                        session.sectionManager.getSection("discussion").showTimer();
                        session.stateMachine.goTo(STATE.BACKUP_CLIENT_WAIT);
                    }
                });

                session.socket.emitData<IOutboundData.BackupClientReturnToQueue>(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_RETURN_TO_QUEUE, { sessionId: session.id });
            }
        }
    }
