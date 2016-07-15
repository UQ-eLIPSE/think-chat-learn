import * as $ from "jquery";

import {IStateHandler} from "../classes/IStateHandler";

import {MoocchatState as STATE} from "../classes/MoocchatStates";

import {WebsocketEvents} from "../classes/Websockets";

import {IEventData_BackupClientEnterQueueState, IEventData_ClientPoolCountUpdate, IEventData_BackupClientQueueUpdate, IEventData_ChatGroupFormed} from "../classes/IEventData";

export const BackupClientWaitStateHandler: IStateHandler<STATE> =
    (session) => {
        const section = session.sectionManager.getSection("backup-client-wait");

        return {
            onEnter: () => {
                session.pageManager.loadPage("backup-client-wait", (page$) => {
                    section.setActive();

                    var $backupClientQueue = page$("ul#backup-client-queue");
                    var $numOfClientsInPool = page$("span#number-of-clients-in-pool");

                    function onBackupClientQueueUpdate(data: IEventData_BackupClientQueueUpdate) {
                        $backupClientQueue.empty();

                        data.clients.forEach(function(client) {
                            var $backupClientLI = $("<li>").text(client.username);

                            if (client.username === session.user.username) {
                                $backupClientLI.css("font-weight", "bold");
                            }

                            $backupClientLI.appendTo($backupClientQueue);
                        });
                    }

                    function onClientPoolCountUpdate(data: IEventData_ClientPoolCountUpdate) {
                        $numOfClientsInPool.text(data.numberOfClients);

                        // Play tone if fewer than 2 remain to get people's attention
                        if (data.numberOfClients < 2) {
                            // https://notificationsounds.com/message-tones/mission-accomplished-252
                            var notificationTone = new Audio("./mp3/mission-accomplished.mp3");
                            notificationTone.play();
                        }
                    }

                    let countdownIntervalHandle: number;

                    function onBackupClientTransferCall() {
                        var $transferConfirmBox = page$("#transfer-confirmation");
                        var $transferCountdown = page$("#transfer-remaining-seconds");

                        $transferConfirmBox.removeClass("hidden");

                        var value = 15;

                        function countdown() {
                            $transferCountdown.text(value--);
                        }

                        countdownIntervalHandle = setInterval(countdown, 1000);
                        countdown();

                        $transferConfirmBox.one("click", "#confirm-transfer", function() {
                            $transferConfirmBox.addClass("hidden");
                            clearInterval(countdownIntervalHandle);
                            session.socket.emit(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_TRANSFER_CONFIRM, { sessionId: session.id });

                            session.socket.once(WebsocketEvents.INBOUND.CHAT_GROUP_FORMED, function(data: IEventData_ChatGroupFormed) {
                                session.stateMachine.goTo(STATE.DISCUSSION, data);
                            });
                        });

                        // https://notificationsounds.com/message-tones/mission-accomplished-252
                        var notificationTone = new Audio("./mp3/mission-accomplished.mp3");
                        notificationTone.play();
                    }

                    // Attach socket listeners to queue and pool status
                    session.socket.on(WebsocketEvents.INBOUND.BACKUP_CLIENT_QUEUE_UPDATE, onBackupClientQueueUpdate);
                    session.socket.on(WebsocketEvents.INBOUND.BACKUP_CLIENT_STANDARD_CLIENT_POOL_COUNT_UPDATE, onClientPoolCountUpdate);
                    session.socket.on(WebsocketEvents.INBOUND.BACKUP_CLIENT_TRANSFER_CALL, onBackupClientTransferCall);
                    session.socket.on(WebsocketEvents.INBOUND.BACKUP_CLIENT_EJECTED, () => { session.stateMachine.goTo(STATE.BACKUP_CLIENT_EJECTED); });

                    // Request information now (once only)
                    session.socket.emit(WebsocketEvents.OUTBOUND.BACKUP_CLIENT_STATUS_REQUEST, { sessionId: session.id });

                    page$("#logout").on("click", () => {
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
