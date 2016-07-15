/**
 * MOOCchat
 * State enum
 * 
 * All the states used for the state machine
 */
export enum MoocchatState {
    STARTUP,
    LOGIN,

    NO_LTI_DATA,
    INVALID_LOGIN,

    WELCOME,
    INITIAL_ANSWER,
    AWAIT_GROUP_FORMATION,
    DISCUSSION,
    REVISED_ANSWER,
    SURVEY,
    COMPLETION,

    BACKUP_CLIENT_ANSWER,
    BACKUP_CLIENT_WAIT,
    BACKUP_CLIENT_RETURN_TO_WAIT,
    BACKUP_CLIENT_EJECTED,
    BACKUP_CLIENT_LOGOUT
}
