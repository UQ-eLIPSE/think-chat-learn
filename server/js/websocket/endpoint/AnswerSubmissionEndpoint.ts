import {WSEndpoint} from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import {PacSeqSocket_Server} from "../../../../common/js/PacSeqSocket_Server";

import * as mongodb from "mongodb";
import {Database} from "../../data/Database";
import {UserSession} from "../../data/models/UserSession";
import {QuestionResponse, IDB_QuestionResponse} from "../../data/models/QuestionResponse";

import {MoocchatUserSession} from "../../user/MoocchatUserSession";

export class AnswerSubmissionEndpoint extends WSEndpoint {
    private static AnswerSubmissionHandlerFactory(socket: PacSeqSocket_Server, answerType: "initial" | "final", db: mongodb.Db) {
        return (data: IWSToServerData.AnswerResponse) => {
            const session = MoocchatUserSession.GetSession(data.sessionId, socket);

            if (!session) {
                return console.error("Attempted answer submission with invalid session ID = " + data.sessionId);
            }

            const optionIdString = data.optionId;
            const justification = data.justification;

            /** Holds reference to the answer object (depends on `answerType`) */
            let sessionAnswerObj: IDB_QuestionResponse;

            /** String for websocket event to be sent on success */
            let onSuccessWebsocketEvent: string;

            /** Function for generating the update set depending on `answerType` */
            let generateUpdateSet: (id: mongodb.ObjectID) => Object;

            switch (answerType) {
                case "initial":
                    sessionAnswerObj = session.data.response.initial;
                    onSuccessWebsocketEvent = "answerSubmissionInitialSaved";
                    generateUpdateSet = (questionResponseObjectId) => {
                        return {
                            responseInitialId: questionResponseObjectId
                        }
                    }
                    break;

                case "final":
                    sessionAnswerObj = session.data.response.final;
                    onSuccessWebsocketEvent = "answerSubmissionFinalSaved";
                    generateUpdateSet = (questionResponseObjectId) => {
                        return {
                            responseFinalId: questionResponseObjectId
                        }
                    }
                    break;

                default:
                    throw new Error("Unrecogised answer type");
            }

            // Check that option ID is valid for session
            if (optionIdString &&
                session.data.quizQuestionOptions
                    .map((option) => option._id.toString())
                    .indexOf(optionIdString) < 0) {
                return;
            }

            // Check that it hasn't already been saved
            if (sessionAnswerObj &&
                sessionAnswerObj._id) {
                return;
            }

            new QuestionResponse(db).insertOne({
                optionId: (optionIdString ? new Database.ObjectId(optionIdString) : null),
                justification: justification,
                timestamp: new Date()
            }, function(err, result) {
                if (err) {
                    return console.error(err);
                }

                const questionResponseObjectId = result.insertedId;

                // Sets the OBJECT that is being held in session.data.response.*
                sessionAnswerObj._id = questionResponseObjectId;
                sessionAnswerObj.optionId = new Database.ObjectId(optionIdString);
                sessionAnswerObj.justification = justification;

                new UserSession(db).updateOne(
                    {
                        _id: new Database.ObjectId(session.getId())
                    },
                    {
                        $set: generateUpdateSet(questionResponseObjectId)
                    },
                    function(err, result) {
                        if (err) {
                            return console.error(err);
                        }

                        session.getSocket().emit(onSuccessWebsocketEvent);
                    });
            });
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