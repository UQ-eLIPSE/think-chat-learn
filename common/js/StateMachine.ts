import { StateMachineDescription } from "./StateMachineDescription";

export class StateMachine {
    private readonly descriptor: StateMachineDescription;
    private currentState: string;

    constructor(descriptor: StateMachineDescription) {
        this.descriptor = descriptor;
        this.updateCurrentState(this.descriptor.getInitialState());
    }

    public getCurrentState() {
        return this.currentState;
    }

    private updateCurrentState(newState: string) {
        this.currentState = newState;
    }

    public executeTransition(label: string, ...args: any[]) {
        const transition = this.descriptor.getTransition(label);

        if (!transition) {
            throw new Error(`No transition labelled "${label}"`);
        }

        const oldState = this.getCurrentState();
        const newState = transition.toState.toString();
        
        const onLeaveOldState = (this.descriptor.getStateChangeHandlers(oldState) || {}).onLeave;
        const onEnterNewState = (this.descriptor.getStateChangeHandlers(newState) || {}).onEnter;

        // Transit
        (function() {
            transition.onBeforeTransition ? transition.onBeforeTransition(label, oldState, newState, ...args) : 0;
            onLeaveOldState ? onLeaveOldState(label, oldState, newState, ...args) : 0;
        })();

        this.updateCurrentState(newState);

        (function() {
            onEnterNewState ? onEnterNewState(label, oldState, newState, ...args) : 0;
            transition.onAfterTransition ? transition.onAfterTransition(label, oldState, newState, ...args) : 0;
        })();
    }


}