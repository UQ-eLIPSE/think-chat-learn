/*
 * MOOCchat
 * StateFlow class module
 * 
 * Holds the state machine that transitions between pages
 */

interface IStateFlowPage<StateEnumType> {
    state: StateEnumType;
    onEnter?: (goToData?: any, onLeaveData?: any) => any;
    onLeave?: (goToData?: any) => any;
}

class StateFlow<StateEnumType> {
    private states: { [state: string]: IStateFlowPage<StateEnumType> } = {};
    private history: IStateFlowPage<StateEnumType>[] = [];

    constructor() {
    }

    public register(data: IStateFlowPage<StateEnumType>) {
        this.states[data.state.toString()] = data;
    }

    public registerAll(dataArray: IStateFlowPage<StateEnumType>[]) {
        dataArray.forEach(data => this.register(data));
    }

    public goTo(newState: StateEnumType, goToData?: any) {
        let currentStateData = this.getCurrentState();
        var newStateData = this.getStateData(newState);

        let onLeaveData: any;

        if (currentStateData) {
            // TODO: timespent

            let onLeave = currentStateData.onLeave;

            if (onLeave) {
                onLeaveData = onLeave(goToData);
            }
        }

        //      Old state
        // --------------------
        //      New state

        this.setNewStateData(newStateData);

        let onEnter = newStateData.onEnter;

        if (onEnter) {
            onEnter(goToData, onLeaveData);
        }
    }



    private getStateData(state: StateEnumType) {
        return this.states[state.toString()];
    }

    private setNewStateData(data: IStateFlowPage<StateEnumType>) {
        this.history.push(data);
    }

    private getCurrentState() {
        if (this.history.length === 0) {
            return;
        }

        return this.history[this.history.length - 1];
    }
}

export = StateFlow;