import { KVStore } from "../../../common/js/KVStore";

export class StateMachineDescription {

    private description: Object;

    private readonly initialState: string;
    private readonly transitions: IStateMachineDescriptionTransition[] = [];
    private readonly stateChangeHandlers = new KVStore<StateChangeHandlerInfo>();

    constructor(initialState: string, transitions?: IStateMachineDescriptionTransition[]) {
        this.initialState = initialState;

        if (transitions) {
            this.addTransitions(transitions);
        }
    }

    public addTransitions(transitions: IStateMachineDescriptionTransition[]) {
        this.transitions.forEach(t => this.addTransition(t.label, t.fromState, t.toState));
    }

    public addTransition(label: string, fromState: string, toState: string, onBeforeTransition?: OnTransitionFunction, onAfterTransition?: OnTransitionFunction) {
        if (this.getTransition(label)) {
            throw new Error(`Transition with label "${label}" already exists`);
        }

        this.transitions.push({
            label,
            fromState,
            toState,
            onBeforeTransition,
            onAfterTransition,
        });
    }

    public addStateChangeHandlers(state: string, changeHandlers: StateChangeHandlerInfo) {
        this.stateChangeHandlers.put(state, changeHandlers);
    }

    public getStateChangeHandlers(state: string) {
        return this.stateChangeHandlers.get(state);
    }

    public getTransition(label: string) {
        return this.transitions.filter(transition => transition.label === label)[0];
    }

    public getPossibleTransitions(fromState: string) {
        return this.transitions.filter(transition => transition.fromState === fromState);
    }

    public getInitialState() {
        return this.initialState;
    }

    public isTerminalState(state: string) {
        return this.getPossibleTransitions(state).length === 0;
    }


}

export type OnTransitionFunction = (label: string, fromState: string, toState: string, ...args: any[]) => void;

export type StateChangeHandlerInfo = {
    onEnter?: OnTransitionFunction,
    onLeave?: OnTransitionFunction,
}

export interface IStateMachineDescriptionTransition {
    label: string,

    fromState: string,
    toState: string,

    onBeforeTransition?: OnTransitionFunction,
    onAfterTransition?: OnTransitionFunction,
}