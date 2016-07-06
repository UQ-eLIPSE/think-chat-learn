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
    SESSION_NOT_AVAILABLE,

    WELCOME,
    INITIAL_ANSWER,
    AWAIT_GROUP_FORMATION,
    DISCUSSION,
    REVISED_ANSWER,
    SURVEY,
    CONFIRMATION,

    BACKUP_CLIENT_ANSWER,
    BACKUP_CLIENT_WAIT,
    BACKUP_CLIENT_EJECTED,
    BACKUP_CLIENT_LOGOUT
}
