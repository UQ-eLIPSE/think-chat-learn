// import { WSEndpoint } from "../WSEndpoint";

// import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
// import { PacSeqSocket_Server } from "../../../../common/js/PacSeqSocket_Server";

// import * as mongodb from "mongodb";

// import { BackupClientQueue } from "../../queue/BackupClientQueue";

// import { QuizAttempt } from "../../quiz/QuizAttempt";
// import { QuestionResponse } from "../../question/QuestionResponse";
// import { QuestionOption } from "../../question/QuestionOption";

// export class BackupClientEndpoint extends WSEndpoint {
//     private static async HandleEnterQueue(socket: PacSeqSocket_Server, data: IWSToServerData.BackupClientAnswer, db: mongodb.Db) {
//         const quizAttempt = QuizAttempt.Get(data.quizAttemptId);

//         if (!quizAttempt) {
//             return console.error("Attempted backup client enter queue with invalid quiz attempt ID = " + data.quizAttemptId);
//         }

//         const questionOption = await QuestionOption.GetAutoFetch(db, data.optionId);

//         if (!questionOption) {
//             return console.error(`Attempted backup client enter queue with invalid question option ID "${data.optionId}"; quiz attempt ID = ${quizAttempt.getId()}`);
//         }

//         const questionResponse = await QuestionResponse.Create(db, {
//             justification: data.justification,
//             timestamp: new Date(),
//         }, questionOption);

//         await quizAttempt.setResponseInitial(questionResponse);

//         // Add the client to the backup queue here, only *after* we
//         // have all the information for question/answer
//         const backupClientQueue = BackupClientQueue.GetQueueWithQuizScheduleFrom(quizAttempt);

//         if (backupClientQueue) {
//             backupClientQueue.addQuizAttempt(quizAttempt);
//         }
//     }

//     private static async HandleReturnToQueue(socket: PacSeqSocket_Server, data: IWSToServerData.BackupClientReturnToQueue, db: mongodb.Db) {
//         const quizAttempt = QuizAttempt.Get(data.quizAttemptId);

//         if (!quizAttempt) {
//             return console.error("Attempted backup client return to queue with invalid quiz attempt ID = " + data.quizAttemptId);
//         }

//         // If quiz attempt does not have answer information attached, we can't return to queue
//         const responseInitial = quizAttempt.getResponseInitial();
//         if (!responseInitial || !responseInitial.getQuestionOption() || !responseInitial.getJustification()) {
//             return console.error(`Quiz attempt "${quizAttempt.getId()}" attempted backup client return to queue when answers not fully available`);
//         }

//         // Create new quiz attempt when reentering queue
//         const userSession = quizAttempt.getUserSession();
//         const quizSchedule = quizAttempt.getQuizSchedule();

//         const newQuizAttempt = await QuizAttempt.Create(db, userSession, quizSchedule);

//         // End the previous quiz attempt instance
//         quizAttempt.destroyInstance();

//         // Question responses are able to be assigned multiple times to
//         //   different quiz attempts (this is only to be available for
//         //   admins though)
//         await newQuizAttempt.setResponseInitial(responseInitial);

//         const backupClientQueue = BackupClientQueue.GetQueueWithQuizScheduleFrom(newQuizAttempt);

//         if (backupClientQueue) {
//             backupClientQueue.addQuizAttempt(newQuizAttempt);
//         }
//     }

//     private static HandleStatusRequest(socket: PacSeqSocket_Server, data: IWSToServerData.BackupClientStatusRequest) {
//         const quizAttempt = QuizAttempt.Get(data.quizAttemptId);

//         if (!quizAttempt) {
//             return console.error("Attempted backup client status request with invalid quiz attempt ID = " + data.quizAttemptId);
//         }

//         const backupClientQueue = BackupClientQueue.GetQueueWithQuizScheduleFrom(quizAttempt);

//         if (backupClientQueue) {
//             backupClientQueue.broadcastQueueChange();
//             backupClientQueue.broadcastWaitPoolCount();
//         }
//     }





//     private db: mongodb.Db;

//     constructor(socket: PacSeqSocket_Server, db: mongodb.Db) {
//         super(socket);
//         this.db = db;
//     }

//     public get onEnterQueue() {
//         return (data: IWSToServerData.BackupClientAnswer) => {
//             BackupClientEndpoint.HandleEnterQueue(this.getSocket(), data, this.db)
//                 .catch(e => console.error(e));
//         };
//     }

//     public get onReturnToQueue() {
//         return (data: IWSToServerData.BackupClientReturnToQueue) => {
//             BackupClientEndpoint.HandleReturnToQueue(this.getSocket(), data, this.db)
//                 .catch(e => console.error(e));
//         };
//     }

//     public get onStatusRequest() {
//         return (data: IWSToServerData.BackupClientStatusRequest) => {
//             BackupClientEndpoint.HandleStatusRequest(this.getSocket(), data);
//         };
//     }

//     public returnEndpointEventHandler(name: string): (data: any) => void {
//         switch (name) {
//             case "backupClientEnterQueue": return this.onEnterQueue;
//             case "backupClientReturnToQueue": return this.onReturnToQueue;
//             case "backupClientStatusRequest": return this.onStatusRequest;
//         }

//         throw new Error(`No endpoint event handler for "${name}"`);
//     }

//     public registerAllEndpointSocketEvents() {
//         WSEndpoint.RegisterSocketWithEndpointEventHandlers(this.getSocket(), this, [
//             "backupClientEnterQueue",
//             "backupClientReturnToQueue",
//             "backupClientStatusRequest",
//         ]);
//     }
// }