import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {WebsocketManager, WebsocketEvents} from "../classes/Websockets";

import {IEventData_BackupClientEnterQueueState} from "../classes/IEventData";

export const BackupClientReturnToWaitStateHandler: IStateHandler<STATE> =
    (session) => {
        return {
            onEnter: () => {
                // Must re-register to return to the queue
                session.socket.once(WebsocketEvents.INBOUND.BACKUP_CLIENT_ENTER_QUEUE_STATE, (data: IEventData_BackupClientEnterQueueState) => {
                    if (data.success) {
                        session.stateMachine.goTo(STATE.BACKUP_CLIENT_WAIT);
                    }
                });

                session.socket.emit(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_RETURN_TO_QUEUE, { sessionId: session.id });
            }
        }
    }
