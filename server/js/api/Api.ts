import * as mongodb from "mongodb";
import * as crypto from "crypto";

import { Moocchat } from "../Moocchat";

import { ILTIData } from "../../../common/interfaces/ILTIData";
import { LTIAuth } from "../auth/lti/LTIAuth";
import { User } from "../user/User";
import { Session } from "../session/Session";

import { Database } from "../data/Database";
// import { User as DBUser, IDB_User } from "../data/models/User";
// import { UserSession as DBUserSession } from "../data/models/UserSession";
import { QuizSchedule as DBQuizSchedule, IDB_QuizSchedule } from "../data/models/QuizSchedule";
import { Question as DBQuestion, IDB_Question } from "../data/models/Question";
import { QuestionOption as DBQuestionOption, IDB_QuestionOption } from "../data/models/QuestionOption";
import { QuestionOptionCorrect as DBQuestionOptionCorrect, IDB_QuestionOptionCorrect } from "../data/models/QuestionOptionCorrect";
// import { Survey as DBSurvey, IDB_Survey } from "../data/models/Survey";

export class Api {

    @ApplySession
    public static GetClientQuiz(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuizSchedule[]>, data: IMoocchatApiToServerStandardRequestBase, session?: Session): void {
        const course = session.getUser().getIdentity().course;

        // Look up quizzes under course
        const db = moocchat.getDb();
        const now = new Date();

        new DBQuizSchedule(db).readAsArray({
            course,
            availableStart: { $lte: now },
            availableEnd: { $gte: now },
        }, (err, result) => {
            if (handleMongoError(err, res)) { return; }

            return res({
                success: true,
                payload: result,
            });
        });
    }

    @ApplySession
    public static GetClientQuestions(moocchat: Moocchat, res: ApiResponseCallback<IDB_Question[]>, data: IMoocchatApiToServerStandardRequestBase, session?: Session): void {
        const course = session.getUser().getIdentity().course;

        // Look up question under course
        const db = moocchat.getDb();

        new DBQuestion(db).readAsArray({
            course,
        }, (err, result) => {
            if (handleMongoError(err, res)) { return; }

            return res({
                success: true,
                payload: result,
            });
        });
    }

    @ApplySession
    @LimitQuestionIdToSession
    public static GetClientQuestion(moocchat: Moocchat, res: ApiResponseCallback<IDB_Question>, data: IMoocchatApiToServerQuestionId, session?: Session): void {
        const db = moocchat.getDb();

        new DBQuestion(db).readAsArray({
            questionId: new Database.ObjectId(data.questionId)
        }, (err, result) => {
            if (handleMongoError(err, res)) { return; }

            // No need to check for question existence; @LimitQuestionIdToSession already covers that

            const fetchedQuestion = result[0];

            return res({
                success: true,
                payload: fetchedQuestion,
            });
        });
    }

    @ApplySession
    @LimitQuestionIdToSession
    public static GetClientQuestion_Options(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuestionOption[]>, data: IMoocchatApiToServerQuestionId, session?: Session): void {
        const db = moocchat.getDb();

        new DBQuestionOption(db).readAsArray({
            questionId: new Database.ObjectId(data.questionId)
        }, (err, result) => {
            if (handleMongoError(err, res)) { return; }

            return res({
                success: true,
                payload: result,
            });
        });
    }

    @ApplySession
    @LimitQuestionIdToSession
    public static GetClientQuestion_CorrectOptions(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuestionOptionCorrect[]>, data: IMoocchatApiToServerQuestionId, session?: Session): void {
        const db = moocchat.getDb();

        new DBQuestionOptionCorrect(db).readAsArray({
            questionId: new Database.ObjectId(data.questionId)
        }, (err, result) => {
            if (handleMongoError(err, res)) { return; }

            return res({
                success: true,
                payload: result,
            });
        });
    }








    public static PostClientLoginLti(moocchat: Moocchat, res: ApiResponseCallback<IMoocchatApiToClientLoginResponsePayload>, data: ILTIData): void {
        // Run auth
        const authObj = new LTIAuth(data);
        const authResult = authObj.authenticate();

        if (!authResult.success) {
            return res(authResult);
        }

        // Set up user object
        const user = new User(authObj.getIdentity());

        // Set up session
        const newSessionId = crypto.randomBytes(16).toString("hex");
        let session: Session;

        try {
            session = new Session(newSessionId, user);
        } catch (e) {
            return res({
                success: false,
                message: e.message,
            });
        }

        return res({
            success: true,
            payload: {
                sessionId: session.getId(),
                timeout: Session.Timeout,
            }
        });
    }

    @ApplySession
    public static PostClientQuestion(moocchat: Moocchat, res: ApiResponseCallback<IMoocchatApiToClientInsertionIdResponse>, data: IMoocchatApiToServerStandardRequestBase & IDB_Question, session?: Session): void {
        const db = moocchat.getDb();
        const course = session.getUser().getIdentity().course;

        new DBQuestion(db).insertOne({
            content: data.content,
            course,
        }, (err, result) => {
            if (handleMongoError(err, res)) { return; }

            return res({
                success: true,
                payload: {
                    questionId: result.insertedId.toHexString(),
                }
            });
        });
    }









    @ApplySession
    @LimitQuestionIdToSession
    public static PutClientQuestion(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApiToServerQuestionId & IDB_Question, session?: Session): void {
        const db = moocchat.getDb();
        const questionId = data.questionId;

        new DBQuestion(db).updateOne(
            {
                _id: new Database.ObjectId(questionId),
            },
            {
                $set: {
                    content: data.content,
                }
            },
            (err, result) => {
                if (handleMongoError(err, res)) { return; }

                return res({
                    success: true,
                });
            });
    }









    @ApplySession
    @LimitQuestionIdToSession
    public static DeleteClientQuestion(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApiToServerQuestionId, session?: Session): void {
        const db = moocchat.getDb();
        const questionId = data.questionId;

        new DBQuestion(db).delete(
            {
                _id: new Database.ObjectId(questionId),
            },
            (err, result) => {
                if (handleMongoError(err, res)) { return; }

                return res({
                    success: true,
                });
            });
    }
}




/**
 * Decorates API endpoints by supplying session as the last parameter where available
 * or automatically responding with a session failure message if not
 */
function ApplySession<Target, InputType extends IMoocchatApiToServerStandardRequestBase, PayloadType>(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<ApiHandlerWithSession<InputType, PayloadType>>) {
    const originalMethod = descriptor.value;

    descriptor.value = function(this: Target, moocchat: Moocchat, res: ApiResponseCallback<PayloadType>, data: InputType) {
        // Load up session
        let session: Session;

        try {
            session = new Session(data.sessionId);
        } catch (e) {
            return res({
                success: false,
                message: e.message,
            });
        }

        // Run the original method with session passed as last parameter
        originalMethod.apply(this, [moocchat, res, data, session]);
    }

    return descriptor;
}


/**
 * Decorates API endpoints by checking that the session should have access to a question
 * with given ID
 */
function LimitQuestionIdToSession<Target, InputType extends IMoocchatApiToServerQuestionId, PayloadType>(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<ApiHandlerWithSession<InputType, PayloadType>>) {
    const originalMethod = descriptor.value;

    descriptor.value = function(this: Target, moocchat: Moocchat, res: ApiResponseCallback<PayloadType>, data: InputType, session: Session) {
        // Check question ID falls within the course of the session identity
        const course = session.getUser().getIdentity().course;
        const questionId = data.questionId;

        // Look up question under course
        const db = moocchat.getDb();

        new DBQuestion(db).readAsArray({
            _id: new Database.ObjectId(questionId),
            course,
        }, (err, result) => {
            if (handleMongoError(err, res)) { return; }

            // If result blank, that means either question does not exist or
            // is not within the course requested in this session 
            if (result.length === 0) {
                return res({
                    success: false,
                    message: `Question ID "${questionId}" cannot be found or is not available for the course associated with your current session`
                });
            }

            // If question exists, then 
            originalMethod.apply(this, [moocchat, res, data, session]);
        });
    }

    return descriptor;
}

function handleMongoError<PayloadType>(err: mongodb.MongoError, res: ApiResponseCallback<PayloadType>) {
    if (err) {
        console.error(err);

        res({
            success: false,
            message: err.message,
        });

        return true;
    }

    return false;
}

// export type IMoocchatApiHandler<PayloadType> = (data: IMoocchatApiToServerBase, session?: Session) => IMoocchatApiResponseBase<PayloadType>;

export type ApiResponseCallback<T> = (response: IMoocchatApiResponseBase<T>) => void;
export type ApiHandlerBase<InputType extends IMoocchatApiToServerStandardRequestBase, PayloadType> = (moocchat: Moocchat, res: ApiResponseCallback<PayloadType>, data: InputType) => void;
export type ApiHandlerWithSession<InputType extends IMoocchatApiToServerStandardRequestBase, PayloadType> = (moocchat: Moocchat, res: ApiResponseCallback<PayloadType>, data: InputType, session: Session) => void;

export interface IMoocchatApiResponseBase<PayloadType> {
    success: boolean,
    message?: string,
    payload?: PayloadType,
}

export interface IMoocchatApiToClientLoginResponsePayload {
    sessionId: string,
    timeout: number,
}

export interface IMoocchatApiToServerStandardRequestBase {
    sessionId: string,
}

export interface IMoocchatApiToServerQuestionId extends IMoocchatApiToServerStandardRequestBase {
    questionId: string,
}

export interface IMoocchatApiToClientInsertionIdResponse {
    [key: string]: string,
}