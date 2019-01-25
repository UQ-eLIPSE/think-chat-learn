import { Conf } from "../../config/Conf";
import { Conf as CommonConf } from "../../../common/config/Conf";

import { KVStore } from "../../../common/js/KVStore";
//import { MoocchatBackupClientQueue } from "./MoocchatBackupClientQueue";

import { QuizAttempt } from "../quiz/QuizAttempt";

import { Utils } from "../../../common/js/Utils";
import { IQuizSession, Response, IResponseMCQ, IResponseQualitative } from "../../../common/interfaces/DBSchema";
import { QuestionType } from "../../../common/enums/DBEnums";
/**
 * The idea is that for each quiz-question combination we set up a pool. Each pool
 * has a queue linked to each question.
 * 
 * Notes one could argue that we should be storing a dictionary of dictionaries but
 * simply having one dictionary is a lot easier to work with. We also note that if
 * quizId and questionId are unique, then the appendment of the two would make a
 * unique id as well
 */
export class MoocchatWaitPool {
    private static DesiredGroupSize: number = Conf.chat.groups.desiredSize;
    private static DesiredMaxWaitTime: number = CommonConf.timings.chatGroupFormationTimeoutMs;
    // A singleton of a pool dictionary where each key is the quiz id
    private static readonly WaitPools = new KVStore<MoocchatWaitPool>();

    // The id of the quiz in which we are interested in
    private _quizId: string;
    // The id of the question in which we are intereted in
    // presumably the combination of the two have a legitimate relationship
    private _questionId: string;

    // The answers of the pool
    private readonly answerQueues = new KVStore<MoocchatWaitPoolAnswerQueueData[]>();


    // Creates or gets a pool. Instantiates based on the quiz id
    public static GetPoolAutoCreate(quizId: string, questionId: string) {
        const waitPool = MoocchatWaitPool.GetPool(quizId, questionId);

        if (!waitPool) {
            // Create new wait pool
            return new MoocchatWaitPool(quizId, questionId);
        }

        return waitPool;
    }

    // Gets the pool of a particular quiz question combiation
    public static GetPool(quizId: string, questionId: string) {
        const combinedId = quizId + questionId;

        return MoocchatWaitPool.WaitPools.get(combinedId);
    }

    // Based on a user reponse to question, grab the details
    public static GetPoolWithQuestionresponse(userResponse: Response) {
        if (!userResponse._id || !userResponse.quizId || !userResponse.questionId) {
            throw new Error("No id for quiz session for pool formation");
        }

        return MoocchatWaitPool.GetPoolAutoCreate(userResponse.quizId, userResponse.questionId);
    }

    // Destroying a pool is essentially making sure the queue for each question option
    // is empty and then removin the reference from the store for garbage collection
    public static Destroy(pool: MoocchatWaitPool) {
        // pool._quizSessionId = undefined;
        pool.answerQueues.empty();

        MoocchatWaitPool.WaitPools.delete(pool.getQuizId() + pool.getQuestionId());
    }

    // Construction of a pools is essentially the creation of an empty answer queue
    // dictionary and obviously a reference to the id
    constructor(quizId: string, questionId: string) {
        this._quizId = quizId;
        this._questionId = questionId

        this.answerQueues.empty();

        // Put into singleton map
        const combinedId = quizId + questionId;

        MoocchatWaitPool.WaitPools.put(combinedId, this);
    }

    // Simple getter
    public getQuizId() {
        return this._quizId;
    }

    public getQuestionId() {
        return this._questionId;
    }

    // The idea is that within a pool, we attempt
    // to create queues based on question option. E.g. if a person answered option A, they will be placed
    // in the queue for option A. Selecting B will point to B... We then attempt to diversify/group up
    // people based on different options.

    public addQuizAttempt(quizResponse: Response) {
        // We get the selected question option that was provided for the answer
        // then use the option ID to place this quiz attempt into the queue for
        // that option.
        // 
        // If there is no question option selected, then we place them into a
        // default queue. This is mainly true for MCQ where we want to diversify options.
        // For a qualititative answer, we simply group them up together by confidence values?
        const answerId = quizResponse.type === QuestionType.MCQ ? 
            (quizResponse as IResponseMCQ).optionId : (quizResponse as IResponseQualitative).confidence.toString();

        // If answer ID is not in queue, create queue for it
        if (!this.answerQueues.hasKey(answerId)) {
            this.answerQueues.put(answerId, []);
        }

        const answerQueue = this.answerQueues.get(answerId)!;

        // If the client/user response is already in the queue, don't do anything.
        for (let i = 0; i < answerQueue.length; ++i) {
            const answerQueueData = answerQueue[i];

            if (answerQueueData.quizResponse._id === quizResponse._id) {
                return;
            }
        }

        // Add client to the queue once all okay 
        answerQueue.push({
            quizResponse,
            timestamp: Date.now()
        });
    }

    // A user wants/needs to get out of the queue for waiting (either due to disconnect or finding a group)
    // remove it from the store
    public removeQuizAttempt(quizResponse: Response) {
        // The idea is basically to iterate through all the queues e.g. quizA,questionB queue
        // and then within the queue, find it. Note we are touching the answer queue
        const answerId = quizResponse.type === QuestionType.MCQ ? 
            (quizResponse as IResponseMCQ).optionId : (quizResponse as IResponseQualitative).confidence.toString();

        const thisAnswerQuizAttemptArray = this.answerQueues.get(answerId)!;

        for (let j = 0; j < thisAnswerQuizAttemptArray.length; ++j) {
            if (thisAnswerQuizAttemptArray[j].quizResponse._id === quizResponse._id) {
                // Remove the client out and return it
                console.log(`Removing quiz attempt '${quizResponse._id}' from wait pool '${this.getQuizId() + this.getQuestionId()}'`);
                return thisAnswerQuizAttemptArray.splice(j, 1)[0].quizResponse;
            }
        }

        return undefined;
    }

    // As the namesake suggests, given a quiz response, check to see if it is in any queue
    // Note a response by the combination of quizId and questioNId
    public hasQuizResponse(quizResponse: Response) {

        const answerId = quizResponse.type === QuestionType.MCQ ? 
            (quizResponse as IResponseMCQ).optionId : (quizResponse as IResponseQualitative).confidence.toString();        

        const thisAnswerQuizAttemptArray = this.answerQueues.get(answerId);
        // Obviously if the queue doesn't exist then return false
        if (!thisAnswerQuizAttemptArray) {
            return false;
        }

        for (let j = 0; j < thisAnswerQuizAttemptArray.length; ++j) {
            // A simple === would assume both reference the same memory
            if (thisAnswerQuizAttemptArray[j].quizResponse._id === quizResponse._id) {
                return true;
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

            return waitTime > MoocchatWaitPool.DesiredMaxWaitTime - 10000;
        });
    }

    public getSize() {
        // Go over answerQueues and sum the length of each queues
        return this.answerQueues.getKeys().reduce((sum, queueKey) => {
            return sum + this.answerQueues.get(queueKey)!.length;
        }, 0);
    }

    // Finds the queue element and then pops it
    private popQuizAttemptFromAnswerQueue(queueKey: string) {
        const poppedFirstElem = this.answerQueues.get(queueKey)!.shift();

        if (!poppedFirstElem) {
            return;
        }

        return poppedFirstElem.quizResponse;
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
                // TODO handle backup queue

                /*const backupClientQueue = MoocchatBackupClientQueue.GetQueue(this.getQuizSessionId());

                if (backupClientQueue &&
                    totalPoolSize === 1 &&
                    backupClientQueue.callToPool(this)) {
                    // Don't do anything if there is a backup client to be placed into the pool
                    // (happens when #callToPool() returns TRUE)
                    return [];
                }*/
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
    quizResponse: Response;
    timestamp: number;
}
