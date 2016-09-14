import {ServerConf} from "../classes/conf/ServerConf";

import {IDB_QuestionOption} from "../classes/data/models/QuestionOption";

import {MoocchatUserSession} from "./MoocchatUserSession";
import {MoocchatBackupClientQueue} from "./MoocchatBackupClientQueue";

/**
 * Replacement for ClientAnswerPool
 */
export class MoocchatWaitPool {
    private static DesiredGroupSize: number = ServerConf.chat.groups.desiredSize;
    private static DesiredMaxWaitTime: number = ServerConf.chat.groups.formationTimeoutMs;
    private static WaitPools: {[quizSessionId: string]: MoocchatWaitPool} = {};

    private _quizSessionId: string;

    private answerQueues: { [answerId: string]: MoocchatWaitPoolAnswerQueueData[] };


    public static GetPool(quizSessionId: string, quizQuestionOptions: IDB_QuestionOption[]) {
        if (!MoocchatWaitPool.WaitPools.hasOwnProperty(quizSessionId)) {
            // Create new wait pool
            return new MoocchatWaitPool(quizSessionId, quizQuestionOptions);
        }

        return MoocchatWaitPool.WaitPools[quizSessionId];
    }

    /** Slight misnomer - gets pool with same quiz schedule as supplied session. Session may not actually be in wait pool. */
    public static GetPoolWithQuizScheduleFrom(session: MoocchatUserSession) {
        return MoocchatWaitPool.GetPool(session.data.quizSchedule._id.toString(), session.data.quizQuestionOptions);
    }

    public static Destroy(pool: MoocchatWaitPool) {
        pool._quizSessionId = undefined;
        pool.answerQueues = {};
        
        delete MoocchatWaitPool.WaitPools[pool.getQuizSessionId()];
    }



    constructor(quizSessionId: string, quizQuestionOptions: IDB_QuestionOption[]) {
        this._quizSessionId = quizSessionId;

        // Set up answer queues as a map between a question answer option ID to MoocchatWaitPoolAnswerQueueData
        this.answerQueues = {};

        quizQuestionOptions.forEach((questionOption) => {
            this.answerQueues[questionOption._id.toString()] = [];
        });

        // Put into singleton map
        MoocchatWaitPool.WaitPools[quizSessionId] = this;
    }

    public getQuizSessionId() {
        return this._quizSessionId;
    }

    public addSession(session: MoocchatUserSession) {
        let answerId = session.data.response.initial.optionId.toString();

        // Answer is either not in range expected or some weird answer
        if (!this.answerQueues.hasOwnProperty(answerId)) {
            // Assign to random queue instead
            const queueKeys = Object.keys(this.answerQueues);
            const randomQueueKeyIndex = Math.floor(Math.random() * queueKeys.length);

            answerId = queueKeys[randomQueueKeyIndex];
        }

        const answerQueue = this.answerQueues[answerId];

        // If the client is already in the queue, don't do anything.
        for (let i = 0; i < answerQueue.length; ++i) {
            const answerQueueData = answerQueue[i];

            if (answerQueueData.session === session) {
                return;
            }
        }

        // Add client to the queue once all okay 
        answerQueue.push({
            session: session,
            timestamp: Date.now()
        });
    }

    public removeSession(session: MoocchatUserSession) {
        // Need to search through the entire pool to remove
        var arr = Object.keys(this.answerQueues);
        for (var i = 0; i < arr.length; ++i) {
            var queueKey = arr[i];
            var thisAnswerSessionDataArray = this.answerQueues[queueKey];

            for (var j = 0; j < thisAnswerSessionDataArray.length; ++j) {
                if (thisAnswerSessionDataArray[j].session === session) {
                    // Remove the client out and return it
                    console.log(`Removing session '${session.getId()}' from wait pool '${this.getQuizSessionId()}'`);
                    return thisAnswerSessionDataArray.splice(j, 1)[0].session;
                }
            }
        }
    }

    public hasSession(session: MoocchatUserSession) {
        var arr = Object.keys(this.answerQueues);
        for (var i = 0; i < arr.length; ++i) {
            var queueKey = arr[i];
            var thisAnswerSessionDataArray = this.answerQueues[queueKey];

            for (var j = 0; j < thisAnswerSessionDataArray.length; ++j) {
                if (thisAnswerSessionDataArray[j].session === session) {
                    return true;
                }
            }
        }

        return false;
    }

    private answerQueueKeysWithSessions() {
        return Object.keys(this.answerQueues).filter((queueKey) => {
            return this.answerQueues[queueKey].length > 0;
        });
    }

    private answerQueueSizes() {
        const queueSizes: { [queueKey: string]: number } = {};

        Object.keys(this.answerQueues).forEach((queueKey) => {
            queueSizes[queueKey] = this.answerQueues[queueKey].length;
        });

        return queueSizes;
    }

    private answerQueueFrontWait() {
        return Object.keys(this.answerQueues).map((queueKey) => {
            const firstQueueSessionData = this.answerQueues[queueKey][0];

            if (!firstQueueSessionData) {
                return 0;
            }

            return Date.now() - firstQueueSessionData.timestamp;
        })
    }

    private waitTimeoutReached() {
        return Object.keys(this.answerQueues).some((queueKey) => {
            const firstQueueSessionData = this.answerQueues[queueKey][0];

            if (!firstQueueSessionData) {
                return false;
            }

            const waitTime = Date.now() - firstQueueSessionData.timestamp;

            return waitTime > MoocchatWaitPool.DesiredMaxWaitTime;
        });
    }

    public getSize() {
        // Go over answerQueues and sum the length of each queues
        return Object.keys(this.answerQueues).reduce((sum, queueKey) => {
            return sum + this.answerQueues[queueKey].length;
        }, 0);
    }

    private popSessionFromAnswerQueue(queueKey: string) {
        return this.answerQueues[queueKey].shift().session;
    }

    public tryFormGroup() {
        const totalPoolSize = this.getSize();

        // If there is enough diversity and the number of clients passes below checks, create group now
        //
        // Below pool size checks:
        //  n       prevents premature creation of groups now when (n+1) size groups may need to be considered in the future
        //  n+1     prevents loner groups from appearing (when groups: {n, 1} may form)
        if (this.answerQueueKeysWithSessions().length >= MoocchatWaitPool.DesiredGroupSize &&
            totalPoolSize !== MoocchatWaitPool.DesiredGroupSize &&
            totalPoolSize !== (MoocchatWaitPool.DesiredGroupSize + 1)) {
            return this.popGroup();
        }

        // If someone is waiting too long, then create groups now
        if (this.waitTimeoutReached()) {
            // If pool size = desiredGroupSize + 1, attempt to create a group of size 2
            // now to attempt to prevent loners from appearing?
            if (totalPoolSize === (MoocchatWaitPool.DesiredGroupSize + 1)) {
                return this.popGroup(2);
            }

            if (totalPoolSize < MoocchatWaitPool.DesiredGroupSize) {
                const backupClientQueue = MoocchatBackupClientQueue.GetQueue(this.getQuizSessionId());
                
                if (backupClientQueue &&
                    totalPoolSize === 1 &&
                    backupClientQueue.callToPool(this)) {
                    // Don't do anything if there is a backup client to be placed into the pool
                    // (happens when #callToPool() returns TRUE)
                    return [];
                }
            }

            // Create chat group (up to desired group size)
            return this.popGroup();
        }

        // Don't produce a group when we don't deem it necessary
        return [];
    }

    private popGroup(size: number = MoocchatWaitPool.DesiredGroupSize) {
        const totalPoolSize = this.getSize();

        // Clamp size to be no larger than total pool size
        if (size > totalPoolSize) {
            size = totalPoolSize;
        }

        const queueSizes = this.answerQueueSizes();
        const queueKeys = Object.keys(queueSizes);
        shuffle(queueKeys);         // Shuffle so that we don't skew groups with more of the first answer overall

        const intendedQueueKeys: string[] = []; // Store queue keys to be mapped into clients for group formation

        // Compile the queues with sessions that we can pop into a new group
        queueKeyCompilationLoop:
        while (true) {
            var intendedQueueKeysStartSize = intendedQueueKeys.length;

            for (var i = 0; i < queueKeys.length; ++i) {
                var queueKey = queueKeys[i];
                var queueSize = queueSizes[queueKey];

                if (queueSize <= 0) {
                    continue;
                }

                intendedQueueKeys.push(queueKey);
                --queueSizes[queueKey];

                if (intendedQueueKeys.length === size) {
                    break queueKeyCompilationLoop;
                }
            }
        }

        return intendedQueueKeys.map((queueKey) => {
            return this.popSessionFromAnswerQueue(queueKey);
        });
    }
}

export interface MoocchatWaitPoolAnswerQueueData {
    session: MoocchatUserSession;
    timestamp: number;
}


/******************************************************************************
 * Shuffles array in place.
 * http://stackoverflow.com/a/6274381
 * 
 * @param {IData[]} a items The array containing the items.
 */
function shuffle<IData>(a: IData[]) {
    let j: number, x: IData, i: number;
    for (let i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}