/**
 * MOOCchat
 * StateTransition interface
 * 
 * Encodes the expected structure to encode actions for each state.
 */
export interface IStateTransition<StateEnumType> {
    onEnter?: (goToData?: any, onLeaveData?: any, previousState?: StateEnumType) => void;
    onLeave?: (goToData?: any, nextState?: StateEnumType) => any;
}
