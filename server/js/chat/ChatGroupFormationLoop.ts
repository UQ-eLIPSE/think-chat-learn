import { Conf } from "../../config/Conf";

import { KVStore } from "../../../common/js/KVStore";

import { MoocchatWaitPool } from "../queue/MoocchatWaitPool";

import { QuizAttempt } from "../quiz/QuizAttempt";

export class ChatGroupFormationLoop {
    private static readonly CGFLInstances = new KVStore<ChatGroupFormationLoop>();
    private static TimeBetweenChecks = Conf.chat.groups.formationIntervalMs;

    public static GetChatGroupFormationLoop(waitPool: MoocchatWaitPool) {
        const cgfl = ChatGroupFormationLoop.CGFLInstances.get(waitPool.getQuizSessionId());

        if (!cgfl) {
            return new ChatGroupFormationLoop(waitPool);
        }

        return cgfl;
    }

    public static GetChatGroupFormationLoopWithQuizScheduleFrom(quizAttempt: QuizAttempt) {
        const waitPool = MoocchatWaitPool.GetPoolWithQuizScheduleFrom(quizAttempt);
        return ChatGroupFormationLoop.GetChatGroupFormationLoop(waitPool);
    }




    private timerHandle: NodeJS.Timer;
    private waitPool: MoocchatWaitPool;

    private onGroupCoalesced: (quizAttempts: QuizAttempt[]) => void;

    private started: boolean = false;

    /**
     * ***Do not*** use this constructor to build a new ChatGroupFormationLoop instance.
     * Use ChatGroupFormationLoop.GetChatGroupFormationLoop() instead.
     * 
     * @param {MoocchatWaitPool} waitPool
     */
    constructor(waitPool: MoocchatWaitPool) {
        this.waitPool = waitPool;

        // Put into singleton map
        ChatGroupFormationLoop.CGFLInstances.put(waitPool.getQuizSessionId(), this);
    }

    public registerOnGroupCoalesced(handler: (quizAttempts: QuizAttempt[]) => void) {
        this.onGroupCoalesced = handler;
    }

    public get hasStarted() {
        return this.started;
    }

    /**
     * Starts loop.
     */
    public start() {
        // #run will automatically set timer to call itself on first execution
        this.run();

        this.started = true;
    }

    public forceRun() {
        this.run();
    }

    /**
     * Runs one round of the loop, and automatically continues to do so.
     * 
     * @private
     */
    private run() {
        clearTimeout(this.timerHandle);

        const quizAttemptsInGroup = this.waitPool.tryFormGroup();

        if (quizAttemptsInGroup && quizAttemptsInGroup.length > 0) {
            if (this.onGroupCoalesced) {
                this.onGroupCoalesced(quizAttemptsInGroup);
            }

            // Process next group at next available timeslot
            setImmediate(() => {
                this.run();
            });
        } else {
            this.timerHandle = setTimeout(() => {
                this.run();
            }, ChatGroupFormationLoop.TimeBetweenChecks);
        }
    }
}