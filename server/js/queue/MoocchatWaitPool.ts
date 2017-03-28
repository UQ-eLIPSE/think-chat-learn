import { Conf } from "../../config/Conf";

import { KVStore } from "../../../common/js/KVStore";
import { MoocchatBackupClientQueue } from "./MoocchatBackupClientQueue";

import { QuizAttempt } from "../quiz/QuizAttempt";

import { Utils } from "../../../common/js/Utils";

export class MoocchatWaitPool {
    private static DesiredGroupSize: number = Conf.chat.groups.desiredSize;
    private static DesiredMaxWaitTime: number = Conf.chat.groups.formationTimeoutMs;
    private static readonly WaitPools = new KVStore<MoocchatWaitPool>();

    private _quizSessionId: string;

    private readonly answerQueues = new KVStore<MoocchatWaitPoolAnswerQueueData[]>();


    public static GetPoolAutoCreate(quizSessionId: string) {
        const waitPool = MoocchatWaitPool.GetPool(quizSessionId);

        if (!waitPool) {
            // Create new wait pool
            return new MoocchatWaitPool(quizSessionId);
        }

        return waitPool;
    }

    public static GetPool(quizSessionId: string) {
        return MoocchatWaitPool.WaitPools.get(quizSessionId);
    }

    public static GetPoolWithQuizScheduleFrom(quizAttempt: QuizAttempt) {
        const quizSchedule = quizAttempt.getQuizSchedule();

        return MoocchatWaitPool.GetPoolAutoCreate(quizSchedule.getId());
    }

    public static Destroy(pool: MoocchatWaitPool) {
        // pool._quizSessionId = undefined;
        pool.answerQueues.empty();

        MoocchatWaitPool.WaitPools.delete(pool.getQuizSessionId());
    }



    constructor(quizSessionId: string) {
        this._quizSessionId = quizSessionId;

        this.answerQueues.empty();

        // Put into singleton map
        MoocchatWaitPool.WaitPools.put(quizSessionId, this);
    }

    public getQuizSessionId() {
        return this._quizSessionId;
    }

    public addQuizAttempt(quizAttempt: QuizAttempt) {
        const responseInitial = quizAttempt.getResponseInitial();

        if (!responseInitial) {
            throw new Error(`Attempted to add quiz attempt to pool without response initial; quiz attempt ID = ${quizAttempt.getId()}`);
        }

        // We get the selected question option that was provided for the answer
        // then use the option ID to place this quiz attempt into the queue for
        // that option.
        // 
        // If there is no question option selected, then we place them into a
        // default queue.
        const answerQuestionOption = responseInitial.getQuestionOption();
        let answerId: string;

        if (answerQuestionOption === undefined) {
            answerId = "";
        } else {
            answerId = answerQuestionOption.getId();
        }

        // If answer ID is not in queue, create queue for it
        if (!this.answerQueues.hasKey(answerId)) {
            this.answerQueues.put(answerId, []);
        }

        const answerQueue = this.answerQueues.get(answerId)!;

        // If the client is already in the queue, don't do anything.
        for (let i = 0; i < answerQueue.length; ++i) {
            const answerQueueData = answerQueue[i];

            if (answerQueueData.quizAttempt === quizAttempt) {
                return;
            }
        }

        // Add client to the queue once all okay 
        answerQueue.push({
            quizAttempt,
            timestamp: Date.now()
        });
    }

    public removeQuizAttempt(quizAttempt: QuizAttempt) {
        // Need to search through the entire pool to remove
        const arr = this.answerQueues.getKeys();

        for (let i = 0; i < arr.length; ++i) {
            const queueKey = arr[i];
            const thisAnswerQuizAttemptArray = this.answerQueues.get(queueKey)!;

            for (let j = 0; j < thisAnswerQuizAttemptArray.length; ++j) {
                if (thisAnswerQuizAttemptArray[j].quizAttempt === quizAttempt) {
                    // Remove the client out and return it
                    console.log(`Removing quiz attempt '${quizAttempt.getId()}' from wait pool '${this.getQuizSessionId()}'`);
                    return thisAnswerQuizAttemptArray.splice(j, 1)[0].quizAttempt;
                }
            }
        }

        return undefined;
    }

    public hasQuizAttempt(quizAttempt: QuizAttempt) {
        const arr = this.answerQueues.getKeys();

        for (let i = 0; i < arr.length; ++i) {
            const queueKey = arr[i];
            const thisAnswerQuizAttemptArray = this.answerQueues.get(queueKey)!;

            for (let j = 0; j < thisAnswerQuizAttemptArray.length; ++j) {
                if (thisAnswerQuizAttemptArray[j].quizAttempt === quizAttempt) {
                    return true;
                }
            }
        }

        return false;
    }

    private answerQueueKeysWithQuizAttempts() {
        return this.answerQueues.getKeys().filter((queueKey) => {
            return this.answerQueues.get(queueKey)!.length > 0;
        });
    }

    private answerQueueSizes() {
        const queueSizes: { [queueKey: string]: number } = {};

        this.answerQueues.getKeys().forEach((queueKey) => {
            queueSizes[queueKey] = this.answerQueues.get(queueKey)!.length;
        });

        return queueSizes;
    }

    private waitTimeoutReached() {
        return this.answerQueues.getKeys().some((queueKey) => {
            const firstInQueueData = this.answerQueues.get(queueKey)![0];

            if (!firstInQueueData) {
                return false;
            }

            const waitTime = Date.now() - firstInQueueData.timestamp;

            return waitTime > MoocchatWaitPool.DesiredMaxWaitTime;
        });
    }

    public getSize() {
        // Go over answerQueues and sum the length of each queues
        return this.answerQueues.getKeys().reduce((sum, queueKey) => {
            return sum + this.answerQueues.get(queueKey)!.length;
        }, 0);
    }

    private popQuizAttemptFromAnswerQueue(queueKey: string) {
        const poppedFirstElem = this.answerQueues.get(queueKey)!.shift();

        if (!poppedFirstElem) {
            return;
        }

        return poppedFirstElem.quizAttempt;
    }

    public tryFormGroup() {
        const totalPoolSize = this.getSize();

        // If there is enough diversity and the number of clients passes below checks, create group now
        //
        // Below pool size checks:
        //  n       prevents premature creation of groups now when (n+1) size groups may need to be considered in the future
        //  n+1     prevents loner groups from appearing (when groups: {n, 1} may form)
        if (this.answerQueueKeysWithQuizAttempts().length >= MoocchatWaitPool.DesiredGroupSize &&
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
        Utils.Array.shuffleInPlace(queueKeys);  // Shuffle so that we don't skew groups with more of the first answer overall

        const intendedQueueKeys: string[] = []; // Store queue keys to be mapped into clients for group formation

        // Compile the queues with sessions that we can pop into a new group
        queueKeyCompilationLoop:
        while (true) {
            for (let i = 0; i < queueKeys.length; ++i) {
                const queueKey = queueKeys[i];
                const queueSize = queueSizes[queueKey];

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
            // Queues should always have the required number of elements that are being popped from queue
            return this.popQuizAttemptFromAnswerQueue(queueKey)!;
        });
    }
}

export interface MoocchatWaitPoolAnswerQueueData {
    quizAttempt: QuizAttempt;
    timestamp: number;
}
