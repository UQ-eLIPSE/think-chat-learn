import { Conf } from "../../config/Conf";

import { KVStore } from "../../../common/js/KVStore";

import { MoocchatWaitPool } from "../queue/MoocchatWaitPool";

import { Response } from "../../../common/interfaces/DBSchema";

export class ChatGroupFormationLoop {
    private static readonly CGFLInstances = new KVStore<ChatGroupFormationLoop>();
    private static TimeBetweenChecks = Conf.chat.groups.formationIntervalMs;

    public static GetChatGroupFormationLoop(waitPool: MoocchatWaitPool) {
        // Remember the ids are based on quiz and question ids
        const cgfl = ChatGroupFormationLoop.CGFLInstances.get(waitPool.getQuizId() + waitPool.getQuestionId());

        if (!cgfl) {
            return new ChatGroupFormationLoop(waitPool);
        }

        return cgfl;
    }

    public static GetChatGroupFormationLoopWithQuizScheduleFrom(userResponse: Response) {
        const waitPool = MoocchatWaitPool.GetPoolWithQuestionresponse(userResponse);
        return ChatGroupFormationLoop.GetChatGroupFormationLoop(waitPool);
    }




    private timerHandle: NodeJS.Timer;
    private waitPool: MoocchatWaitPool;

    private onGroupCoalesced: (quizResponse: Response[]) => void;

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
        ChatGroupFormationLoop.CGFLInstances.put(waitPool.getQuizId() + waitPool.getQuestionId(), this);
    }

    public registerOnGroupCoalesced(handler: (userResponses: Response[]) => void) {
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