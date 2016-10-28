import { KVStore } from "./KVStore";

export class StateMachineDescription {
    private readonly initialState: string;
    private readonly transitions: IStateMachineDescriptionTransition[] = [];
    private readonly stateChangeHandlers = new KVStore<StateChangeHandlerInfo>();

    constructor(initialState: StateLabel, transitions?: IStateMachineDescriptionTransition[]) {
        this.initialState = initialState.toString();

        if (transitions) {
            this.addTransitions(transitions);
        }
    }

    public addTransitions(transitions: IStateMachineDescriptionTransition[]) {
        transitions.forEach(t => this.addTransition(t.label, t.fromState, t.toState, t.onBeforeTransition, t.onAfterTransition));
    }

    public addTransition(label: string, fromState: StateLabel | null | undefined, toState: StateLabel, onBeforeTransition?: OnTransitionFunction, onAfterTransition?: OnTransitionFunction) {
        if (label === "*") {
            throw new Error(`Label value "${label}" is reserved`);
        }

        if (this.getTransition(label)) {
            throw new Error(`Transition with label "${label}" already exists`);
        }

        if (toState === "*") {
            throw new Error(`Transitions cannot have ambiguous resultant state`);
        }

        // From state can be left blank to represent the any state
        if (fromState !== 0 && !fromState) {
            fromState = "*";
        }

        this.transitions.push({
            label,
            fromState,
            toState,
            onBeforeTransition,
            onAfterTransition,
        });
    }

    public addStateChangeHandlers(state: StateLabel, changeHandlers: StateChangeHandlerInfo) {
        this.stateChangeHandlers.put(state.toString(), changeHandlers);
    }

    public getStateChangeHandlers(state: StateLabel) {
        return this.stateChangeHandlers.get(state.toString());
    }

    public getTransition(label: string) {
        return this.transitions.filter(transition => transition.label === label)[0];
    }

    public getPossibleTransitions(fromState: StateLabel) {
        return this.transitions.filter(
            transition =>
                (transition.fromState === fromState.toString()) || (transition.fromState === "*")
        );
    }

    public getInitialState() {
        return this.initialState;
    }

    public isTerminalState(state: StateLabel) {
        return this.getPossibleTransitions(state.toString()).length === 0;
    }


}

export type OnTransitionFunction = (label: string, fromState: string, toState: string, ...args: any[]) => void | boolean;

export type StateChangeHandlerInfo = {
    onEnter?: OnTransitionFunction,
    onLeave?: OnTransitionFunction,
}

export interface IStateMachineDescriptionTransition {
    label: string,

    fromState: StateLabel,
    toState: StateLabel,

    onBeforeTransition?: OnTransitionFunction,
    onAfterTransition?: OnTransitionFunction,
}

export type StateLabel = string | number;