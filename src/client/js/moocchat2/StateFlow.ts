import {IStateTransition} from "./IStateTransition";

interface IStateFlowState<StateEnumType> extends IStateTransition<StateEnumType> {
    state: StateEnumType;
}

/**
 * MOOCchat
 * StateFlow class module
 * 
 * Holds the state machine that transitions between pages
 */
export class StateFlow<StateEnumType> {
    private states: { [state: string]: IStateFlowState<StateEnumType> } = {};
    private history: IStateFlowState<StateEnumType>[] = [];

    /**
     * Registers a state.
     * 
     * @param {IStateFlowState} data State data
     */
    public register(data: IStateFlowState<StateEnumType>) {
        this.states[data.state.toString()] = data;
    }

    /**
     * Registers multiple states in one go.
     * 
     * @param {IStateFlowState[]} dataArray State data array
     */
    public registerAll(dataArray: IStateFlowState<StateEnumType>[]) {
        dataArray.forEach(data => this.register(data));
    }

    /**
     * Triggers a transition to a new state.
     * 
     * @param {StateEnumType} newState
     * @param {any} goToData Data to pass to the onLeave() function of the old state and onEnter() function of the new state
     */
    public goTo(newState: StateEnumType, goToData?: any) {
        let oldStateData = this.getCurrentState();
        var newStateData = this.getStateData(newState);

        let onLeaveData: any;

        if (oldStateData) {
            // TODO: record time spent in state 

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

    /**
     * Gets the requested registered state data.
     * 
     * @return {IStateFlowState}
     */
    private getStateData(state: StateEnumType) {
        return this.states[state.toString()];
    }

    /**
     * Sets new state data.
     * 
     * @param {IStateFlowState} data
     */
    private setNewStateData(data: IStateFlowState<StateEnumType>) {
        this.history.push(data);
    }

    /**
     * Gets the state data for the current state.
     * 
     * @return {IStateFlowState}
     */
    private getCurrentState() {
        if (this.history.length === 0) {
            return;
        }

        return this.history[this.history.length - 1];
    }
}
