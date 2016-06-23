import {IStateTransition} from "./IStateTransition";

/*
 * MOOCchat
 * StateFlow class module
 * 
 * Holds the state machine that transitions between pages
 */

interface IStateFlowState<StateEnumType> extends IStateTransition<StateEnumType> {
    state: StateEnumType;
}

export class StateFlow<StateEnumType> {
    private states: { [state: string]: IStateFlowState<StateEnumType> } = {};
    private history: IStateFlowState<StateEnumType>[] = [];

    constructor() {
    }

    public register(data: IStateFlowState<StateEnumType>) {
        this.states[data.state.toString()] = data;
    }

    public registerAll(dataArray: IStateFlowState<StateEnumType>[]) {
        dataArray.forEach(data => this.register(data));
    }

    public goTo(newState: StateEnumType, goToData?: any) {
        let oldStateData = this.getCurrentState();
        var newStateData = this.getStateData(newState);

        let onLeaveData: any;

        if (oldStateData) {
            // TODO: timespent

            let onLeave = oldStateData.onLeave;

            if (onLeave) {
                onLeaveData = onLeave(goToData, newStateData.state);
            }
        }

        //      Old state
        // --------------------
        //      New state

        this.setNewStateData(newStateData);

        let onEnter = newStateData.onEnter;

        if (onEnter) {
            onEnter(goToData, onLeaveData, ((oldStateData) ? oldStateData.state : void 0));
        }
    }



    private getStateData(state: StateEnumType) {
        return this.states[state.toString()];
    }

    private setNewStateData(data: IStateFlowState<StateEnumType>) {
        this.history.push(data);
    }

    private getCurrentState() {
        if (this.history.length === 0) {
            return;
        }

        return this.history[this.history.length - 1];
    }
}
