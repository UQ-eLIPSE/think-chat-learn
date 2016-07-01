import * as socket from "socket.io-client";

export const WebsocketEvents = {
    INBOUND: {
        LOGIN_SUCCESS: "loginSuccess",
        LOGIN_FAILURE: "loginFailure",
        LOGIN_USER_ALREADY_EXISTS: "loginExistingUser",

        INITIAL_ANSWER_SUBMISSION_SAVED: "answerSubmissionInitialSaved",

        CHAT_GROUP_FORMED: "chatGroupFormed",
        CHAT_GROUP_RECEIVE_MESSAGE: "chatGroupMessage",

        BACKUP_CLIENT_ENTER_QUEUE_STATE: "backupClientEnterQueueState",
        BACKUP_CLIENT_QUEUE_UPDATE: "backupClientQueueUpdate",
        BACKUP_CLIENT_TRANSFER_CALL: "backupClientTransferCall",
        BACKUP_CLIENT_EJECTED: "backupClientEjected",

        BACKUP_CLIENT_STANDARD_CLIENT_POOL_COUNT_UPDATE: "clientPoolCountUpdate",

    },

    OUTBOUND: {
        LOGIN_REQUEST: "login_req",
        LOGIN_LTI_REQUEST: "loginLti",
        
        INITIAL_ANSWER_SUBMISSION: "answerSubmissionInitial",

        CHAT_GROUP_JOIN_REQUEST: "chatGroupJoinRequest",
        CHAT_GROUP_SEND_MESSAGE: "chatGroupMessage",

        REVISED_ANSWER_SUBMISSION: "probingQuestionFinalAnswerSubmission",

        BACKUP_CLIENT_ANSWER_AND_JOIN_QUEUE: "backupClientEnterQueue",
        BACKUP_CLIENT_RETURN_TO_QUEUE: "backupClientReturnToQueue",
        BACKUP_CLIENT_STATUS_REQUEST: "backupClientStatusRequest",
        BACKUP_CLIENT_TRANSFER_CONFIRM: "backupClientTransferConfirm",

    }
}

/**
 * MOOCchat
 * Websocket management class module
 * 
 * Acts as thin layer over Socket.IO object
 */
export class WebsocketManager {
    private socket: SocketIOClient.Socket;

    public open() {
        this.socket = socket.connect({
            path: "/socket.io",
            transports: ["websocket"]
        });

        this.on("error", () => {
            alert("The server for this task is currently unavailable. It may be currently offline for maintenance. Please try again later.");
        })
    }

    public close() {
        this.socket.close();
    }

    // Map across Socket.io methods
    // Using .bind(this.socket) would erase parameter/type information because
    // TypeScript outputs .bind() as `any`.

    public emit(event: string, ...args: any[]) {
        return this.socket.emit(event, ...args);
    }

    public on(event: string, fn: Function) {
        return this.socket.on(event, fn);
    }

    public off(event: string, fn?: Function) {
        return this.socket.off(event, fn);
    }

    public once(event: string, fn: Function) {
        return this.socket.once(event, fn);
    }
}