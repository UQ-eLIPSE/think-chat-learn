/**
 * MOOCchat
 * State enum
 * 
 * All the states used for the state machine
 */
export enum MoocchatState {
    WELCOME,
    INITIAL_ANSWER,
    AWAIT_GROUP_FORMATION,
    DISCUSSION,
    REVISED_ANSWER,
    SURVEY,
    CONFIRMATION
}
