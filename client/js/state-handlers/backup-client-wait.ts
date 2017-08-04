import * as $ from "jquery";

import {IStateHandler, MoocchatState as STATE} from "../MoocchatStates";

import {WebsocketEvents} from "../WebsocketEvents";

import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../../common/interfaces/IWSToServerData";

export const BackupClientWaitStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("backup-client-wait");

        return {
            onEnter: () => {
                session.pageManager.loadPage("backup-client-wait", (page$) => {
                    section.setActive();

                    const $backupClientQueue = page$("ul#backup-client-queue");
                    const $numOfClientsInPool = page$("span#number-of-clients-in-pool");

                    function onBackupClientQueueUpdate(data: IWSToClientData.BackupClientQueueUpdate) {
                        $backupClientQueue.empty();

                        data.clients.forEach((client) => {
                            const $backupClientLI = $("<li>").text(client.username);

                            if (client.username === session.user.username) {
                                $backupClientLI.css("font-weight", "bold");
                            }

                            $backupClientLI.appendTo($backupClientQueue);
                        });
                    }

                    function onClientPoolCountUpdate(data: IWSToClientData.ClientPoolCountUpdate) {
                        $numOfClientsInPool.text(data.numberOfClients);

                        // Play tone if fewer than 2 remain to get people's attention
                        if (data.numberOfClients < 2) {
                            // https://notificationsounds.com/message-tones/mission-accomplished-252
                            const notificationTone = new Audio("./static/mp3/mission-accomplished.mp3");
                            notificationTone.play();
                        }
                    }

                    let countdownIntervalHandle: number;

                    function onBackupClientTransferCall() {
                        const $transferConfirmBox = page$("#transfer-confirmation");
                        const $transferCountdown = page$("#transfer-remaining-seconds");

                        $transferConfirmBox.removeClass("hidden");

                        let value = 15;

                        function countdown() {
                            $transferCountdown.text(value--);
                        }

                        countdownIntervalHandle = setInterval(countdown, 1000);
                        countdown();

                        $transferConfirmBox.one("click", "#confirm-transfer", () => {
                            $transferConfirmBox.addClass("hidden");
                            clearInterval(countdownIntervalHandle);
                            session.socket.emitData<IWSToServerData.BackupClientTransferConfirm>(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_TRANSFER_CONFIRM, { quizAttemptId: session.quizAttemptId });

                            session.socket.once<IWSToClientData.ChatGroupFormed>(WebsocketEvents.INBOUND.CHAT_GROUP_FORMED, (data) => {
                                session.stateMachine.goTo(STATE.DISCUSSION, data);
                            });
                        });

                        // https://notificationsounds.com/message-tones/mission-accomplished-252
                        const notificationTone = new Audio("./static/mp3/mission-accomplished.mp3");
                        notificationTone.play();
                    }

                    function onBackupClientEjected() {
                        session.stateMachine.goTo(STATE.BACKUP_CLIENT_EJECTED);
                    }

                    // Attach socket listeners to queue and pool status
                    session.socket.on<IWSToClientData.BackupClientQueueUpdate>(WebsocketEvents.INBOUND.BACKUP_CLIENT_QUEUE_UPDATE, onBackupClientQueueUpdate);
                    session.socket.on<IWSToClientData.ClientPoolCountUpdate>(WebsocketEvents.INBOUND.BACKUP_CLIENT_STANDARD_CLIENT_POOL_COUNT_UPDATE, onClientPoolCountUpdate);
                    session.socket.on(WebsocketEvents.INBOUND.BACKUP_CLIENT_TRANSFER_CALL, onBackupClientTransferCall);
                    session.socket.on(WebsocketEvents.INBOUND.BACKUP_CLIENT_EJECTED, onBackupClientEjected);

                    // Request information now (once only)
                    session.socket.emitData<IWSToServerData.BackupClientStatusRequest>(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_STATUS_REQUEST, { quizAttemptId: session.quizAttemptId });

                    page$("#logout").one("click", () => {
                        session.stateMachine.goTo(STATE.BACKUP_CLIENT_LOGOUT);
                    });
                });
            },
            onLeave: () => {
                section.unsetActive();

                // Detach listeners
                session.socket.off(WebsocketEvents.INBOUND.BACKUP_CLIENT_QUEUE_UPDATE);
                session.socket.off(WebsocketEvents.INBOUND.BACKUP_CLIENT_STANDARD_CLIENT_POOL_COUNT_UPDATE);
                session.socket.off(WebsocketEvents.INBOUND.BACKUP_CLIENT_TRANSFER_CALL);
                session.socket.off(WebsocketEvents.INBOUND.BACKUP_CLIENT_EJECTED);
            }
        }
    }
