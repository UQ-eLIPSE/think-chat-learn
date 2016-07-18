import {IStateTransition} from "./IStateTransition";

export interface IStateFlow_State<StateEnumType> extends IStateTransition<StateEnumType> {
    state: StateEnumType;
}

export interface IStateFlow_StateHistory<StateEnumType> {
    entryTimestamp: number;
    stateData: IStateFlow_State<StateEnumType>;
}
