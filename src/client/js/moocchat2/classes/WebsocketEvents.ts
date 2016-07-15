export const WebsocketEvents = {
    INBOUND: {
        /** IInboundData.LoginSuccess */
        LOGIN_SUCCESS: "loginSuccess",

        /** IInboundData.LoginFailure */
        LOGIN_FAILURE: "loginFailure",

        /** IInboundData.LoginExistingUser */
        LOGIN_USER_ALREADY_EXISTS: "loginExistingUser",

        /** void */
        INITIAL_ANSWER_SUBMISSION_SAVED: "answerSubmissionInitialSaved",

        /** IInboundData.ChatGroupFormed */
        CHAT_GROUP_FORMED: "chatGroupFormed",

        /** IInboundData.ChatGroupMessage */
        CHAT_GROUP_RECEIVE_MESSAGE: "chatGroupMessage",

        /** IInboundData.ChatGroupQuitStatusChange */
        CHAT_GROUP_QUIT_STATUS_CHANGE: "chatGroupQuitChange",

        /** IInboundData.BackupClientEnterQueueState */
        BACKUP_CLIENT_ENTER_QUEUE_STATE: "backupClientEnterQueueState",

        /** IInboundData.BackupClientQueueUpdate */
        BACKUP_CLIENT_QUEUE_UPDATE: "backupClientQueueUpdate",

        /** void */
        BACKUP_CLIENT_TRANSFER_CALL: "backupClientTransferCall",

        /** void */
        BACKUP_CLIENT_EJECTED: "backupClientEjected",

        /** IInboundData.ClientPoolCountUpdate */
        BACKUP_CLIENT_STANDARD_CLIENT_POOL_COUNT_UPDATE: "clientPoolCountUpdate"
    },

    OUTBOUND: {
        /** IOutboundData.LoginLti */
        LOGIN_LTI_REQUEST: "loginLti",

        /** IOutboundData.InitialAnswer */
        INITIAL_ANSWER_SUBMISSION: "answerSubmissionInitial",

        /** IOutboundData.ChatGroupJoin */
        CHAT_GROUP_JOIN_REQUEST: "chatGroupJoinRequest",

        /** IOutboundData.ChatGroupSendMessage */
        CHAT_GROUP_SEND_MESSAGE: "chatGroupMessage",

        /** IOutboundData.ChatGroupQuitStatusChange */
        CHAT_GROUP_QUIT_STATUS_CHANGE: "chatGroupQuitStatusChange",

        /** IOutboundData.RevisedAnswer */
        REVISED_ANSWER_SUBMISSION: "answerSubmissionFinal",

        /** IOutboundData.BackupClientAnswer */
        BACKUP_CLIENT_ANSWER_AND_JOIN_QUEUE: "backupClientEnterQueue",
        
        /** IOutboundData.BackupClientReturnToQueue */
        BACKUP_CLIENT_RETURN_TO_QUEUE: "backupClientReturnToQueue",
        
        /** IOutboundData.BackupStatusRequest */
        BACKUP_CLIENT_STATUS_REQUEST: "backupClientStatusRequest",
        
        /** IOutboundData.BackupClientTransferConfirm */
        BACKUP_CLIENT_TRANSFER_CONFIRM: "backupClientTransferConfirm",

        /** IOutboundData.SurveyResponse */
        SURVEY_SUBMISSION: "submitSurvey"
    }
}
