export const WebsocketEvents = {
    INBOUND: {
        /** IWSToClientData.LoginSuccess */
        LOGIN_SUCCESS: "loginSuccess",

        /** IWSToClientData.LoginFailure */
        LOGIN_FAILURE: "loginFailure",

        /** IWSToClientData.LoginExistingUser */
        LOGIN_USER_ALREADY_EXISTS: "loginExistingUser",

        /** void */
        LOGIN_RESEARCH_CONSENT_SAVED: "researchConsentSaved",

        /** void */
        INITIAL_ANSWER_SUBMISSION_SAVED: "answerSubmissionInitialSaved",

        /** void */
        REVISED_ANSWER_SUBMISSION_SAVED: "answerSubmissionFinalSaved",

        /** IWSToClientData.ChatGroupFormed */
        CHAT_GROUP_FORMED: "chatGroupFormed",

        /** IWSToClientData.ChatGroupMessage */
        CHAT_GROUP_RECEIVE_MESSAGE: "chatGroupMessage",

        CHAT_GROUP_RECEIVE_SYSTEM_MESSAGE: "chatGroupSystemMessage",

        /** IWSToClientData.ChatGroupQuitStatusChange */
        CHAT_GROUP_QUIT_STATUS_CHANGE: "chatGroupQuitChange",

        /** IWSToClientData.ChatGroupDisconnect */
        CHAT_GROUP_DISCONNECT: "chatGroupDisconnect",

        /** IWSToClientData.ChatGroupTypingNotification */
        CHAT_GROUP_TYPING_NOTIFICATION: "chatGroupTypingNotification",

        /** IWSToClientData.ChatGroupUpdate */
        CHAT_GROUP_UPDATE: "chatGroupUpdate",

        /** IWSToClientData.BackupClientEnterQueueState */
        BACKUP_CLIENT_ENTER_QUEUE_STATE: "backupClientEnterQueueState",

        /** IWSToClientData.BackupClientQueueUpdate */
        BACKUP_CLIENT_QUEUE_UPDATE: "backupClientQueueUpdate",

        /** void */
        BACKUP_CLIENT_TRANSFER_CALL: "backupClientTransferCall",

        /** void */
        BACKUP_CLIENT_EJECTED: "backupClientEjected",

        /** IWSToClientData.ClientPoolCountUpdate */
        BACKUP_CLIENT_STANDARD_CLIENT_POOL_COUNT_UPDATE: "clientPoolCountUpdate",

        /** IWSToClientData.LogoutSuccess */
        LOGOUT_SUCCESS: "logoutSuccess",

        /** IWSToClientData.StoreSessionAck */
        STORE_SESSION_ACK: "StoreSessionAcknowledged"
    },

    OUTBOUND: {
        /** IWSToServerData.LoginLti */
        LOGIN_LTI_REQUEST: "loginLti",

        /** boolean */
        LOGIN_RESEARCH_CONSENT_SET: "researchConsentSet",

        /** IWSToServerData.InitialAnswer */
        INITIAL_ANSWER_SUBMISSION: "answerSubmissionInitial",

        /** IWSToServerData.ChatGroupJoin */
        CHAT_GROUP_JOIN_REQUEST: "chatGroupJoinRequest",

        /** IWSToServerData.ChatGroupSendMessage */
        CHAT_GROUP_SEND_MESSAGE: "chatGroupMessage",

        /** IWSToServerData.ChatGroupQuitStatusChange */
        CHAT_GROUP_QUIT_STATUS_CHANGE: "chatGroupQuitStatusChange",

        /** IWSToServerData.ChatGroupTypingNotification */
        CHAT_GROUP_TYPING_NOTIFICATION: "chatGroupTypingNotification",

        /** IWSToServerData.ChatGroupUpdate */
        CHAT_GROUP_UPDATE: "chatGroupUpdate",

        /** IWSToServerData.RevisedAnswer */
        REVISED_ANSWER_SUBMISSION: "answerSubmissionFinal",

        /** IWSToServerData.BackupClientAnswer */
        BACKUP_CLIENT_ANSWER_AND_JOIN_QUEUE: "backupClientEnterQueue",

        /** IWSToServerData.BackupClientReturnToQueue */
        BACKUP_CLIENT_RETURN_TO_QUEUE: "backupClientReturnToQueue",

        /** IWSToServerData.BackupStatusRequest */
        BACKUP_CLIENT_STATUS_REQUEST: "backupClientStatusRequest",

        /** IWSToServerData.BackupClientTransferConfirm */
        BACKUP_CLIENT_TRANSFER_CONFIRM: "backupClientTransferConfirm",

        /** IWSToServerData.SurveyResponse */
        SURVEY_SUBMISSION: "submitSurvey",

        /** IWSToServerData.Logout */
        LOGOUT: "logout",

        /** IWSToServerData.SessionSocketResync */
        SESSION_SOCKET_RESYNC: "sessionSocketResync",

        /** IWSToServerData.StoreSocket */
        STORE_QUIZ_SESSION_SOCKET: "storeQuizSessionSocket"
    }
};
