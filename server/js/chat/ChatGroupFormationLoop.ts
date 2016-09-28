import {Conf} from "../../config/Conf";

import {MoocchatWaitPool} from "../queue/MoocchatWaitPool";
import {MoocchatChatGroup} from "../chat/MoocchatChatGroup";
import {MoocchatUserSession} from "../user/MoocchatUserSession";

export class ChatGroupFormationLoop {
    private static CGFLInstances: { [quizSessionId: string]: ChatGroupFormationLoop } = {};
    private static TimeBetweenChecks = Conf.chat.groups.formationIntervalMs;

    public static GetChatGroupFormationLoop(waitPool: MoocchatWaitPool) {
        const cgfl = ChatGroupFormationLoop.CGFLInstances[waitPool.getQuizSessionId()];

        if (!cgfl) {
            return new ChatGroupFormationLoop(waitPool);
        }

        return cgfl;
    }

    public static GetChatGroupFormationLoopWithQuizScheduleFrom(session: MoocchatUserSession) {
        const waitPool = MoocchatWaitPool.GetPoolWithQuizScheduleFrom(session);
        return ChatGroupFormationLoop.GetChatGroupFormationLoop(waitPool);
    }




    private timerHandle: NodeJS.Timer;
    private waitPool: MoocchatWaitPool;
    
    private onSessionAssignedChatGroup: (newChatGroup: MoocchatChatGroup, session: MoocchatUserSession) => void;
    private onChatGroupFormed: (newChatGroup: MoocchatChatGroup) => void;

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
        ChatGroupFormationLoop.CGFLInstances[waitPool.getQuizSessionId()] = this;
    }

    public registerOnSessionAssignedChatGroup(handler: (newChatGroup: MoocchatChatGroup, session: MoocchatUserSession) => void) {
        this.onSessionAssignedChatGroup = handler;
    }

    public registerOnChatGroupFormed(handler: (newChatGroup: MoocchatChatGroup) => void) {
        this.onChatGroupFormed = handler;
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
     * Runs a loop round.
     * 
     * Note that this is a property NOT on the prototype chain.
     * This is to ensure the `this` binding stays with the class.
     * 
     * @private
     */
    private run() {
        clearTimeout(this.timerHandle);

        const sessionsInGroup = this.waitPool.tryFormGroup();

        if (sessionsInGroup && sessionsInGroup.length > 0) {
            // Form chat group
            const newChatGroup = new MoocchatChatGroup(sessionsInGroup);

            // Run onSessionAssignedChatGroup per session
            if (this.onSessionAssignedChatGroup) {
                newChatGroup.getSessions().forEach((session) => {
                    this.onSessionAssignedChatGroup(newChatGroup, session);
                });
            } else {
                console.error(`No onSessionAssignedChatGroup`);
            }

            // Run onChatGroupFormed
            if (this.onChatGroupFormed) {
                this.onChatGroupFormed(newChatGroup);
            } else {
                console.error(`No onChatGroupFormed`);
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