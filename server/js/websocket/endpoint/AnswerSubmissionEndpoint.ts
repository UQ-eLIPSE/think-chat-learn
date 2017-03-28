import { WSEndpoint } from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import { PacSeqSocket_Server } from "../../../../common/js/PacSeqSocket_Server";

import * as mongodb from "mongodb";

import { QuizAttempt } from "../../quiz/QuizAttempt";

import { QuestionOption } from "../../question/QuestionOption";
import { QuestionResponse } from "../../question/QuestionResponse";

export class AnswerSubmissionEndpoint extends WSEndpoint {
    private static async AnswerSubmissionHandler(socket: PacSeqSocket_Server, answerType: "initial" | "final", db: mongodb.Db, data: IWSToServerData.AnswerResponse) {
        const quizAttempt = QuizAttempt.Get(data.quizAttemptId);

        if (!quizAttempt) {
            return console.error("Attempted answer submission with invalid quiz attempt ID = " + data.quizAttemptId);
        }

        const justification = data.justification;
        const questionOptionId = data.optionId;

        // Fetch question option
        const questionOption = await QuestionOption.GetAutoFetch(db, questionOptionId);

        // We accept `null` as a valid answer to permit students to proceed with the activity
        if (questionOptionId !== null) {
            if (!questionOption) {
                return console.error("Could not find question option ID = " + questionOptionId);
            }

            // Check it is valid to quiz
            if (questionOption.getQuestion() !== quizAttempt.getQuizSchedule().getQuestion()) {
                return console.error(`Question option ${questionOption.getId()} refers to question ${questionOption.getQuestion().getId()}, but quiz attempt ${quizAttempt.getId()} relies on quiz schedule referring to question ${quizAttempt.getQuizSchedule().getQuestion().getId()}`);
            }
        }

        /** String for websocket event to be sent on success */
        let onSuccessWebsocketEvent: string;

        switch (answerType) {
            case "initial":
                // Prevent resubmits
                if (quizAttempt.getResponseInitial()) {
                    return;
                }

                onSuccessWebsocketEvent = "answerSubmissionInitialSaved";
                break;

            case "final":
                // Prevent resubmits
                if (quizAttempt.getResponseFinal()) {
                    return;
                }

                onSuccessWebsocketEvent = "answerSubmissionFinalSaved";
                break;

            default:
                return console.error(`Unrecognised response type "${answerType}" for answer submission`);
        }

        // Create response; then set within quiz attempt 
        const questionResponse = await QuestionResponse.Create(db, {
            justification,
            timestamp: new Date(),
        }, questionOption);

        quizAttempt.setQuizResponse(answerType, questionResponse);

        socket.emit(onSuccessWebsocketEvent);
    }

    private static AnswerSubmissionHandlerFactory(socket: PacSeqSocket_Server, answerType: "initial" | "final", db: mongodb.Db) {
        return (data: IWSToServerData.AnswerResponse) => {
            AnswerSubmissionEndpoint.AnswerSubmissionHandler(socket, answerType, db, data)
                .catch(e => console.error(e));
        }
    }



    private db: mongodb.Db;

    constructor(socket: PacSeqSocket_Server, db: mongodb.Db) {
        super(socket);
        this.db = db;
    }

    public get onAnswerSubmissionInitial() {
        return AnswerSubmissionEndpoint.AnswerSubmissionHandlerFactory(this.getSocket(), "initial", this.db);
    }

    public get onAnswerSubmissionFinal() {
        return AnswerSubmissionEndpoint.AnswerSubmissionHandlerFactory(this.getSocket(), "final", this.db);
    }

    public returnEndpointEventHandler(name: string): (data: any) => void {
        switch (name) {
            case "answerSubmissionInitial": return this.onAnswerSubmissionInitial;
            case "answerSubmissionFinal": return this.onAnswerSubmissionFinal;
        }

        throw new Error(`No endpoint event handler for "${name}"`);
    }

    public registerAllEndpointSocketEvents() {
        WSEndpoint.RegisterSocketWithEndpointEventHandlers(this.getSocket(), this, [
            "answerSubmissionInitial",
            "answerSubmissionFinal",
        ]);
    }
}
