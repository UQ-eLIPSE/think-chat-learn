
// import { Moocchat } from "../Moocchat";
import { Session } from "../session/Session";

import { KVStore } from "../../../common/js/KVStore";

import { StateMachine } from "../../../common/js/StateMachine";
import { StateMachineDescription } from "../../../common/js/StateMachineDescription";

import { SessionStoreKeys } from "../session/SessionStoreKeys";

const fsmKey = SessionStoreKeys._MOOCCHATATTEMPT_FSM;

enum QUIZ_ATTEMPT_STATE {
    ZERO,

    WELCOME,

}

export class QuizAttempt {
    private static readonly SingletonStore = new KVStore<QuizAttempt>();

    private readonly session: Session;

    private static GetStateMachineDescription() {
        const fsmDesc = new StateMachineDescription(QUIZ_ATTEMPT_STATE.ZERO, [
            {
                label: "STARTUP",
                fromState: QUIZ_ATTEMPT_STATE.ZERO,
                toState: QUIZ_ATTEMPT_STATE.WELCOME,
            }
        ]);
        return fsmDesc;
    }

    constructor(session: Session, init: boolean = false) {
        const existingAttempt = QuizAttempt.SingletonStore.get(session.getId());

        if (existingAttempt) {
            if (init) {
                // Cannot init; new user session is required
                throw new QuizAttemptExistsInSessionError();
            }

            if (!existingAttempt.getFsm()) {
                // For some reason there is no FSM even though there's an attempt...
                throw new QuizAttemptFSMDoesNotExistError();
            }

            // If we are just merely fetching the singleton, return it
            return existingAttempt;
        }


        // You must explicitly call for an init at this point since we do not have an existing attempt on record
        if (!init) {
            throw new QuizAttemptDoesNotExistError();
        }


        // Store references
        this.session = session;

        // Create and store FSM for attempt
        const fsm = new StateMachine(QuizAttempt.GetStateMachineDescription());
        session.getStore().put(fsmKey, fsm);

        // Keep track of this new attempt in singleton store
        QuizAttempt.SingletonStore.put(this.session.getId(), this);


        return this;
    }

    private getFsm(): StateMachine | undefined {
        // FSM is only available via. session store, because the MoocchatAttempt class
        // is only intended to be a thin wrapper; this also means that if the session
        // is destroyed, the FSM object goes with it as there should be no reference
        // to the object itself
        return this.session.getStore().get(fsmKey);
    }

    public executeTransition(label: string, ...args: any[]) {
        this.getFsm().executeTransition(label, ...args);
    }

    public getCurrentState() {
        return this.getFsm().getCurrentState();
    }
}

export class QuizAttemptExistsInSessionError extends Error { }
export class QuizAttemptDoesNotExistError extends Error { }
export class QuizAttemptFSMDoesNotExistError extends Error { }