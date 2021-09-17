// import Config from "../../config/Config";

// import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";

// import { QuizAttempt } from "../quiz/QuizAttempt";
// import { MoocchatWaitPool } from "./MoocchatWaitPool";

// export class MoocchatBackupClientQueue {
//     private static BackupClientQueues: { [quizSessionId: string]: MoocchatBackupClientQueue } = {};

//     private _quizAttempts: QuizAttempt[];
//     private _quizSessionId: string;

//     private quizAttemptToCall: QuizAttempt | undefined;
//     private callNoResponseTimeoutHandle: number;

//     public static GetQueue(quizSessionId: string) {
//         if (!MoocchatBackupClientQueue.BackupClientQueues.hasOwnProperty(quizSessionId)) {
//             // Create new queue
//             return new MoocchatBackupClientQueue(quizSessionId);
//         }

//         return MoocchatBackupClientQueue.BackupClientQueues[quizSessionId];
//     }

//     /**
//      * Gets queue with same quiz schedule as supplied quiz attempt.
//      * Quiz attempt may not actually be in queue.
//      * 
//      * @static
//      * @param {QuizAttempt} quizAttempt
//      * @returns
//      */
//     public static GetQueueWithQuizScheduleFrom(quizAttempt: QuizAttempt) {
//         return MoocchatBackupClientQueue.GetQueue(quizAttempt.getQuizSchedule().getId());
//     }

//     public static Destroy(backupQueue: MoocchatBackupClientQueue) {
//         delete backupQueue._quizSessionId;
//         delete backupQueue._quizAttempts;

//         delete MoocchatBackupClientQueue.BackupClientQueues[backupQueue.getQuizSessionId()];
//     }




//     constructor(quizSessionId: string) {
//         this._quizSessionId = quizSessionId;
//         this._quizAttempts = [];

//         // Put into singleton map
//         MoocchatBackupClientQueue.BackupClientQueues[this.getQuizSessionId()] = this;
//     }

//     public getQuizSessionId() {
//         return this._quizSessionId;
//     }

//     public getQuizAttempts() {
//         return this._quizAttempts;
//     }


//     public broadcast(event: string, data: any) {
//         this.getQuizAttempts().forEach((quizAttempt) => {
//             const socket = quizAttempt.getUserSession().getSocket();

//             if (!socket) {
//                 return;
//             }

//             socket.emit(event, data);
//         });
//     }

//     public broadcastQueueChange() {
//         this.broadcast("backupClientQueueUpdate", {
//             clients: this._quizAttempts.map((quizAttempt) => {
//                 return {
//                     username: quizAttempt.getUserSession().getUser().getUsername()
//                 }
//             })
//         });
//     }

//     public broadcastWaitPoolCount() {
//         const waitPool = MoocchatWaitPool.GetPool(this.getQuizSessionId());

//         // If there is no wait pool, stop
//         if (!waitPool) {
//             return;
//         }

//         this.broadcast("clientPoolCountUpdate", {
//             backupClientQueue: {
//                 quizScheduleId: this.getQuizSessionId()
//             },
//             numberOfClients: waitPool.getSize()
//         });
//     }

//     public addQuizAttempt(quizAttempt: QuizAttempt) {
//         if (this._quizAttempts.indexOf(quizAttempt) > -1) {
//             return;
//         }

//         console.log(`MoocchatBackupClientQueue(${this.getQuizSessionId()}) ADDING Quiz Attempt ${quizAttempt.getId()}`);

//         this._quizAttempts.push(quizAttempt);

//         this.broadcastQueueChange();

//         const socket = quizAttempt.getUserSession().getSocket();

//         if (!socket) {
//             return console.error(`No socket available to emit "backupClientEnterQueueState" to quiz attempt ${quizAttempt.getId()}`);
//         }

//         socket.emitData<IWSToClientData.BackupClientEnterQueueState>("backupClientEnterQueueState", {
//             success: true,
//             quizAttemptId: quizAttempt.getId(),
//         });
//     }

//     public removeQuizAttempt(quizAttempt: QuizAttempt) {
//         const index = this._quizAttempts.indexOf(quizAttempt);

//         if (index < 0) {
//             return undefined;
//         }

//         console.log(`MoocchatBackupClientQueue(${this.getQuizSessionId()}) REMOVING Quiz Attempt ${quizAttempt.getId()}`);

//         const removedSession = this._quizAttempts.splice(index, 1)[0];

//         if (this.quizAttemptToCall === removedSession) {
//             clearTimeout(this.callNoResponseTimeoutHandle);
//             this.quizAttemptToCall = undefined;
//         }

//         this.broadcastQueueChange();

//         return removedSession;
//     }


//     /**
//      * @return {boolean} Whether call has been made and we are waiting for a backup client to pop over to the supplied wait pool
//      */
//     public callToPool(waitPool: MoocchatWaitPool) {
//         // If already called, then return true while we wait
//         if (this.quizAttemptToCall) {
//             return true;
//         }

//         // Set quiz attempt to call
//         const quizAttemptToCall = this._quizAttempts[0];

//         if (!quizAttemptToCall) {
//             return false;
//         }

//         const quizAttemptToCallSocket = quizAttemptToCall.getUserSession().getSocket();

//         if (!quizAttemptToCallSocket) {
//             return false;
//         }

//         // If we can get the session then store as session to call
//         this.quizAttemptToCall = quizAttemptToCall;


//         const noResponseFunc = () => {
//             const quizAttemptToCallSocket = quizAttemptToCall.getUserSession().getSocket();

//             if (quizAttemptToCallSocket) {
//                 quizAttemptToCallSocket.off("backupClientTransferConfirm", responseFunc);
//                 quizAttemptToCallSocket.emit("backupClientEjected");
//             }

//             this.removeQuizAttempt(quizAttemptToCall);

//             // Run again
//             this.callToPool(waitPool);
//         }

//         const responseFunc = () => {
//             const quizAttemptToCallSocket = quizAttemptToCall.getUserSession().getSocket()

//             if (quizAttemptToCallSocket) {
//                 quizAttemptToCallSocket.off("backupClientTransferConfirm", responseFunc);
//             }

//             clearTimeout(this.callNoResponseTimeoutHandle);

//             console.log(`MoocchatBackupClientQueue(${this.getQuizSessionId()}) MOVING TO POOL Session ${quizAttemptToCall.getId()}`);

//             this.removeQuizAttempt(quizAttemptToCall);
//             waitPool.addQuizAttempt(quizAttemptToCall);
//         }

//         // If no response then timeout handler will run to move backup client queue on
//         // TODO: Fix `any` type workaround
//         this.callNoResponseTimeoutHandle = <any>setTimeout(noResponseFunc, Conf.backupClient.callConfirmTimeoutMs);

//         // Handle confirm response
//         quizAttemptToCallSocket.once("backupClientTransferConfirm", responseFunc);


//         // Send call out
//         console.log(`MoocchatBackupClientQueue(${this.getQuizSessionId()}) CALLING Session ${quizAttemptToCall.getId()}`);
//         quizAttemptToCallSocket.emit("backupClientTransferCall");

//         return true;
//     }
// }