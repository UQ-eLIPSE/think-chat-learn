import { StateMachineDescription } from "./StateMachineDescription";

export class StateMachine {
    private readonly descriptor: StateMachineDescription;
    private currentState: string;
    private halted: boolean = false;

    constructor(descriptor: StateMachineDescription) {
        this.descriptor = descriptor;
        this.updateCurrentState(this.descriptor.getInitialState());
    }

    public halt() {
        this.halted = true;
    }

    public getCurrentState() {
        return this.currentState;
    }

    private updateCurrentState(newState: string) {
        if (this.halted) {
            return;
        }

        this.currentState = newState;
    }

    public executeTransition(label: string, ...args: any[]) {
        if (this.halted) {
            return;
        }

        const transition = this.descriptor.getTransition(label);

        if (!transition) {
            throw new Error(`No transition labelled "${label}"`);
        }

        const oldState = this.getCurrentState();
        const newState = transition.toState.toString();

        const onLeaveOldState = (this.descriptor.getStateChangeHandlers(oldState) || {}).onLeave;
        const onEnterNewState = (this.descriptor.getStateChangeHandlers(newState) || {}).onEnter;

        // Transit
        // Each level can stop the transition by returning false
        try {
            (function() {
                if (transition.onBeforeTransition ? (transition.onBeforeTransition(label, oldState, newState, ...args) === false) : 0) {
                    throw new TransitionBreak(`Stopped transition "${label}" after onBeforeTransition`);
                }

                if (onLeaveOldState ? (onLeaveOldState(label, oldState, newState, ...args) === false) : 0) {
                    throw new TransitionBreak(`Stopped transition "${label}" after onLeaveOldState`);
                }
            })();

            this.updateCurrentState(newState);

            (function() {
                if (onEnterNewState ? (onEnterNewState(label, oldState, newState, ...args) === false) : 0) {
                    throw new TransitionBreak(`Stopped transition "${label}" after onEnterNewState`);
                }

                if (transition.onAfterTransition ? (transition.onAfterTransition(label, oldState, newState, ...args) === false) : 0) {
                    throw new TransitionBreak(`Stopped transition "${label}" after onAfterTransition`);
                }
            })();
        } catch (e) {
            if (e instanceof TransitionBreak) {
                console.log(e.message);
            } else {
                throw e;
            }
        }
    }
}

class TransitionBreak {
    constructor (public message: string) {}
    toString() { return this.message; }
}
