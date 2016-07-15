import {IStateTransition} from "./IStateTransition";

interface IStateFlowState<StateEnumType> extends IStateTransition<StateEnumType> {
    state: StateEnumType;
}

interface IStateFlowStateHistory<StateEnumType> {
    entryTimestamp: number;
    stateData: IStateFlowState<StateEnumType>;
}

/**
 * MOOCchat
 * StateFlow class module
 * 
 * Holds the state machine that transitions between pages
 */
export class StateFlow<StateEnumType> {
    private states: { [state: string]: IStateFlowState<StateEnumType> } = {};
    private history: IStateFlowStateHistory<StateEnumType>[] = [];

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
        let oldStateHistoryData = this.getCurrentStateHistoryData();
        let newStateData = this.getStateData(newState);

        let onLeaveData: any;

        if (oldStateHistoryData) {
            // TODO: Time spent needs to be sent out as event?
            let timeSpent = Date.now() - oldStateHistoryData.entryTimestamp;

            let onLeave = oldStateHistoryData.stateData.onLeave;

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
            onEnter(goToData, onLeaveData, ((oldStateHistoryData) ? oldStateHistoryData.stateData.state : undefined));
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
        this.history.push({
            entryTimestamp: Date.now(),
            stateData: data
        });
    }

    /**
     * Gets the state data for the current state.
     * 
     * @return {IStateFlowState}
     */
    private getCurrentState() {
        let historyData = this.getCurrentStateHistoryData();
        
        if (!historyData) {
            return;
        }

        return historyData.stateData;
    }

    /**
     * Gets the history data for the current state.
     * 
     * @return {IStateFlowStateHistory}
     */
    private getCurrentStateHistoryData() {
        if (this.history.length === 0) {
            return;
        }

        return this.history[this.history.length - 1];
    }
}
