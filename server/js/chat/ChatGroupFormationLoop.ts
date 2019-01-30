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
        cgfl.numberOfGoes = 0;
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
    /** TODO: Make number of formations a configurable variable. */
    private numberOfFormations: number = 200;
    private numberOfGoes: number = 0;

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
        this.numberOfGoes++;
        if (quizAttemptsInGroup && quizAttemptsInGroup.length > 0) {
            if (this.onGroupCoalesced) {
                this.onGroupCoalesced(quizAttemptsInGroup);
            }

            this.numberOfGoes = 0;

            // Process next group at next available timeslot
            setImmediate(() => {
                this.run();
            });
        } else {
            if (this.numberOfGoes >= this.numberOfFormations) {
                ChatGroupFormationLoop.CGFLInstances.delete(this.waitPool.getQuizId() + this.waitPool.getQuestionId());
                MoocchatWaitPool.Destroy(this.waitPool);
            } else {
                this.timerHandle = setTimeout(() => {
                    return this.run();
                }, ChatGroupFormationLoop.TimeBetweenChecks);
            }

            return;
        }
    }
}