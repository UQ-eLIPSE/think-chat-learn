import {IStateFlow_State, IStateFlow_StateHistory} from "./IStateFlow";

/**
 * MOOCchat
 * StateFlow class module
 * 
 * Holds the state machine that transitions between pages
 */
export class StateFlow<StateEnumType> {
    private states: { [state: string]: IStateFlow_State<StateEnumType> } = {};
    private history: IStateFlow_StateHistory<StateEnumType>[] = [];

    /**
     * Registers a state.
     * 
     * @param {IStateFlow_State} data State data
     */
    public register(data: IStateFlow_State<StateEnumType>) {
        this.states[data.state.toString()] = data;
    }

    /**
     * Registers multiple states in one go.
     * 
     * @param {IStateFlow_State[]} dataArray State data array
     */
    public registerAll(dataArray: IStateFlow_State<StateEnumType>[]) {
        dataArray.forEach(data => this.register(data));
    }

    /**
     * Triggers a transition to a new state.
     * 
     * @param {StateEnumType} newState
     * @param {any} goToData Data to pass to the onLeave() function of the old state and onEnter() function of the new state
     */
    public goTo(newState: StateEnumType, goToData?: any) {
        const oldStateHistoryData = this.getCurrentStateHistoryData();
        const newStateData = this.getStateData(newState);

        let onLeaveData: any;

        if (oldStateHistoryData) {
            const onLeave = oldStateHistoryData.stateData.onLeave;

            if (onLeave) {
                onLeaveData = onLeave(goToData, newStateData.state);
            }
        }

        //      Old state
        // --------------------
        //      New state

        this.setNewStateData(newStateData);

        const onEnter = newStateData.onEnter;

        if (onEnter) {
            onEnter(goToData, onLeaveData, ((oldStateHistoryData) ? oldStateHistoryData.stateData.state : undefined));
        }
    }

    /**
     * Gets the requested registered state data.
     * 
     * @return {IStateFlow_State}
     */
    private getStateData(state: StateEnumType) {
        return this.states[state.toString()];
    }

    /**
     * Sets new state data.
     * 
     * @param {IStateFlow_State} data
     */
    private setNewStateData(data: IStateFlow_State<StateEnumType>) {
        this.history.push({
            entryTimestamp: Date.now(),
            stateData: data
        });
    }

    /**
     * Gets the state data for the current state.
     * 
     * @return {IStateFlow_State}
     */
    private getCurrentState() {
        const historyData = this.getCurrentStateHistoryData();
        
        if (!historyData) {
            return;
        }

        return historyData.stateData;
    }

    /**
     * Gets the history data for the current state.
     * 
     * @return {IStateFlow_StateHistory}
     */
    private getCurrentStateHistoryData() {
        if (this.history.length === 0) {
            return;
        }

        return this.history[this.history.length - 1];
    }
}
