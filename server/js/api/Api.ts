import * as mongodb from "mongodb";
import * as crypto from "crypto";
import * as os from "os";

import * as ApiDecorators from "./ApiDecorators";

import { Moocchat } from "../Moocchat";

import * as IMoocchatApi from "../../../common/interfaces/IMoocchatApi";
import { ILTIData } from "../../../common/interfaces/ILTIData";
import { LTIAuth } from "../auth/lti/LTIAuth";
import { Session } from "../session/Session";

import { Database } from "../data/Database";
import { User as DBUser, IDB_User } from "../data/models/User";
import { UserSession as DBUserSession, IDB_UserSession } from "../data/models/UserSession";
import { QuizSchedule as DBQuizSchedule, IDB_QuizSchedule } from "../data/models/QuizSchedule";
import { Question as DBQuestion, IDB_Question } from "../data/models/Question";
import { QuestionOption as DBQuestionOption, IDB_QuestionOption } from "../data/models/QuestionOption";
import { QuestionOptionCorrect as DBQuestionOptionCorrect, IDB_QuestionOptionCorrect } from "../data/models/QuestionOptionCorrect";
// import { Survey as DBSurvey, IDB_Survey } from "../data/models/Survey";

import { QuizAttempt, QuizAttemptExistsInSessionError, QuizAttemptDoesNotExistError, QuizAttemptFSMDoesNotExistError } from "../quiz/QuizAttempt";

export namespace Api {
    export class Admin {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Get_PermissionTest(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerStandardRequestBase, session?: Session): void {
            // @ApiDecorators.AdminOnly automatically returns unauthorised response if user not admin
            // The response below only occurs if user is admin
            return res({
                success: true,
                payload: undefined,
            });
        }
    }

    export class Quiz {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Gets(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuizSchedule[]>, data: IMoocchatApi.ToServerStandardRequestBase, session?: Session): void {
            const course = session.getCourse();

            // Look up quizzes under course
            const db = moocchat.getDb();
            // const now = new Date();

            new DBQuizSchedule(db).readAsArray({
                course,
                // availableStart: { $lte: now },
                // availableEnd: { $gte: now },
            }, (err, result) => {
                if (handleMongoError(err, res)) { return; }

                return res({
                    success: true,
                    payload: result,
                });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Gets_NowFuture(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuizSchedule[]>, data: IMoocchatApi.ToServerStandardRequestBase, session?: Session): void {
            const course = session.getCourse();

            // Look up quizzes under course
            const db = moocchat.getDb();
            const now = new Date();

            new DBQuizSchedule(db).readAsArray({
                course,
                // availableStart: { $lte: now },
                availableEnd: { $gte: now },
            }, (err, result) => {
                if (handleMongoError(err, res)) { return; }

                return res({
                    success: true,
                    payload: result,
                });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitQuizIdToSession
        public static Get(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuizSchedule>, data: IMoocchatApi.ToServerQuizId, session?: Session): void {
            const db = moocchat.getDb();

            new DBQuizSchedule(db).readAsArray({
                _id: new Database.ObjectId(data.quizId)
            }, (err, result) => {
                if (handleMongoError(err, res)) { return; }

                // No need to check for quiz existence; @ApiDecorators.LimitQuizIdToSession already covers that

                const fetchedQuiz = result[0];

                return res({
                    success: true,
                    payload: fetchedQuiz,
                });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Post(moocchat: Moocchat, res: ApiResponseCallback<IMoocchatApi.ToClientInsertionIdResponse>, data: IMoocchatApi.ToServerStandardRequestBase & IDB_QuizSchedule, session?: Session): void {
            precheckQuizScheduleInsert(moocchat, session, res, data, (questionId, availableStart, availableEnd) => {
                const db = moocchat.getDb();
                const course = session.getCourse();

                new DBQuizSchedule(db).insertOne({
                    questionId,
                    course,
                    availableStart,
                    availableEnd,
                }, (err, result) => {
                    if (handleMongoError(err, res)) { return; }

                    return res({
                        success: true,
                        payload: {
                            id: result.insertedId.toHexString(),
                        }
                    });
                });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitQuizIdToSession
        public static Put(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuizId & IDB_QuizSchedule, session?: Session): void {
            precheckQuizScheduleUpdate(moocchat, session, res, data, (questionId, availableStart, availableEnd) => {
                const db = moocchat.getDb();
                const quizId = data.quizId;

                new DBQuizSchedule(db).updateOne(
                    {
                        _id: new Database.ObjectId(quizId),
                    },
                    {
                        $set: {
                            questionId,
                            availableStart,
                            availableEnd,
                        }
                    },
                    (err, result) => {
                        if (handleMongoError(err, res)) { return; }

                        return res({
                            success: true,
                            payload: undefined,
                        });
                    });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitQuizIdToSession
        public static Delete(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuizId, session?: Session): void {
            const db = moocchat.getDb();
            const quizId = data.quizId;

            new DBQuizSchedule(db).delete(
                {
                    _id: new Database.ObjectId(quizId),
                },
                (err, result) => {
                    if (handleMongoError(err, res)) { return; }

                    return res({
                        success: true,
                        payload: undefined,
                    });
                });
        }

    }

    export class Question {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Gets(moocchat: Moocchat, res: ApiResponseCallback<IDB_Question[]>, data: IMoocchatApi.ToServerStandardRequestBase, session?: Session): void {
            const course = session.getCourse();

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

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitQuestionIdToSession
        public static Get(moocchat: Moocchat, res: ApiResponseCallback<IDB_Question>, data: IMoocchatApi.ToServerQuestionId, session?: Session): void {
            const db = moocchat.getDb();

            new DBQuestion(db).readAsArray({
                _id: new Database.ObjectId(data.questionId)
            }, (err, result) => {
                if (handleMongoError(err, res)) { return; }

                // No need to check for question existence; @ApiDecorators.LimitQuestionIdToSession already covers that

                const fetchedQuestion = result[0];

                return res({
                    success: true,
                    payload: fetchedQuestion,
                });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Post(moocchat: Moocchat, res: ApiResponseCallback<IMoocchatApi.ToClientInsertionIdResponse>, data: IMoocchatApi.ToServerStandardRequestBase & IDB_Question, session?: Session): void {
            const db = moocchat.getDb();
            const course = session.getCourse();

            new DBQuestion(db).insertOne({
                title: data.title || "",
                content: data.content || "",
                course,
            }, (err, result) => {
                if (handleMongoError(err, res)) { return; }

                return res({
                    success: true,
                    payload: {
                        id: result.insertedId.toHexString(),
                    }
                });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitQuestionIdToSession
        public static Put(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuestionId & IDB_Question, session?: Session): void {
            const db = moocchat.getDb();
            const questionId = data.questionId;

            const title = data.title === undefined ? undefined : (data.title || "");
            const content = data.content === undefined ? undefined : (data.content || "");

            new DBQuestion(db).updateOne(
                {
                    _id: new Database.ObjectId(questionId),
                },
                {
                    $set: {
                        title,
                        content,
                    }
                },
                (err, result) => {
                    if (handleMongoError(err, res)) { return; }

                    return res({
                        success: true,
                        payload: undefined,
                    });
                });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitQuestionIdToSession
        public static Delete(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuestionId, session?: Session): void {
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
                        payload: undefined,
                    });
                });
        }
    }

    export class QuestionOption {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitQuestionIdToSession
        public static Gets_WithQuestionId(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuestionOption[]>, data: IMoocchatApi.ToServerQuestionId, session?: Session): void {
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

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitQuestionIdToSession
        public static Post_WithQuestionId(moocchat: Moocchat, res: ApiResponseCallback<IMoocchatApi.ToClientInsertionIdResponse>, data: IMoocchatApi.ToServerQuestionId & IDB_QuestionOption, session?: Session): void {
            const db = moocchat.getDb();

            new DBQuestionOption(db).insertOne({
                content: data.content || "",
                questionId: new Database.ObjectId(data.questionId),
                sequence: data.sequence,
            }, (err, result) => {
                if (handleMongoError(err, res)) { return; }

                return res({
                    success: true,
                    payload: {
                        id: result.insertedId.toHexString(),
                    }
                });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitQuestionIdToSession
        @ApiDecorators.LimitQuestionOptionIdToQuestionId
        public static Put_WithQuestionId(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuestionId & IMoocchatApi.ToServerQuestionOptionId & IDB_QuestionOption, session?: Session): void {
            precheckQuestionOptionUpdate(moocchat, session, res, data, (content, sequence) => {
                const db = moocchat.getDb();

                new DBQuestionOption(db).updateOne(
                    {
                        _id: new Database.ObjectId(data.questionOptionId),
                    },
                    {
                        $set: {
                            content,
                            sequence,
                        }
                    },
                    (err, result) => {
                        if (handleMongoError(err, res)) { return; }

                        return res({
                            success: true,
                            payload: undefined,
                        });
                    });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitQuestionIdToSession
        @ApiDecorators.LimitQuestionOptionIdToQuestionId
        public static Delete_WithQuestionId(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuestionId & IMoocchatApi.ToServerQuestionOptionId, session?: Session): void {
            const db = moocchat.getDb();

            new DBQuestionOption(db).delete(
                {
                    _id: new Database.ObjectId(data.questionOptionId),
                },
                (err, result) => {
                    if (handleMongoError(err, res)) { return; }

                    return res({
                        success: true,
                        payload: undefined,
                    });
                });
        }
    }

    export class QuestionOptionCorrect {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitQuestionIdToSession
        public static Gets_WithQuestionId(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuestionOptionCorrect[]>, data: IMoocchatApi.ToServerQuestionId, session?: Session): void {
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
    }

    export class User {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitUserIdToSession
        public static Get(moocchat: Moocchat, res: ApiResponseCallback<IDB_User>, data: IMoocchatApi.ToServerUserId, session?: Session): void {
            const db = moocchat.getDb();

            new DBUser(db).readAsArray({
                _id: new Database.ObjectId(data.userId)
            }, (err, result) => {
                if (handleMongoError(err, res)) { return; }

                // No need to check for existence; @ApiDecorators.LimitUserIdToSession already covers that

                const fetchedUser = result[0];

                return res({
                    success: true,
                    payload: fetchedUser,
                });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Gets(moocchat: Moocchat, res: ApiResponseCallback<IDB_User[]>, data: IMoocchatApi.ToServerStandardRequestBase, session?: Session): void {
            const course = session.getCourse();

            // Look up all quiz schedules in course, then all user sessions, then map to users
            const db = moocchat.getDb();

            new DBQuizSchedule(db)
                .readWithCursor({
                    course,
                })
                .project({
                    _id: 1,
                })
                .toArray((err, result) => {
                    if (handleMongoError(err, res)) { return; }

                    const quizIds = result.map((result: { _id: mongodb.ObjectID }) => result._id);

                    new DBUserSession(db)
                        .readWithCursor({
                            quizScheduleId: {
                                $in: quizIds,
                            }
                        }).project({
                            _id: 0,
                            userId: 1,
                        }).toArray((err, result) => {
                            if (handleMongoError(err, res)) { return; }

                            const userIds = result.map((result: { userId: mongodb.ObjectID }) => result.userId);

                            new DBUser(db).readAsArray({
                                _id: {
                                    $in: userIds,
                                }
                            }, (err, result) => {
                                if (handleMongoError(err, res)) { return; }

                                return res({
                                    success: true,
                                    payload: result,
                                });
                            })
                        });
                });


        }
    }

    export class UserSession {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitUserIdToSession
        public static Gets_WithUserId(moocchat: Moocchat, res: ApiResponseCallback<IDB_UserSession[]>, data: IMoocchatApi.ToServerUserId, session?: Session): void {
            const db = moocchat.getDb();

            new DBUserSession(db)
                .readAsArray({
                    userId: new Database.ObjectId(data.userId)
                }, (err, result) => {
                    if (handleMongoError(err, res)) { return; }

                    return res({
                        success: true,
                        payload: result,
                    });
                });
        }
    }

    export class LoginSession {
        public static Post_Lti(moocchat: Moocchat, res: ApiResponseCallback<IMoocchatApi.ToClientLoginResponsePayload>, data: ILTIData): void {
            // Run auth
            const authObj = new LTIAuth(data);
            const authResult = authObj.authenticate();

            if (!authResult.success) {
                authResult
                return res({
                    success: false,
                    code: "AUTHENTICATION_FAILED",
                    message: authResult.message,
                });
            }

            // Set up session
            const newSessionId = crypto.randomBytes(16).toString("hex");
            let session: Session;

            try {
                session = new Session(newSessionId, authObj.getIdentity());
            } catch (e) {
                return res({
                    success: false,
                    code: "SESSION_INITIALISATION_FAILED",
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

        @ApiDecorators.ApplySession
        public static Delete(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerStandardRequestBase, session?: Session): void {
            Session.Destroy(session);

            return res({
                success: true,
                payload: undefined,
            });
        }
    }

    export class System {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Get_Info(moocchat: Moocchat, res: ApiResponseCallback<SysInfo>, data: IMoocchatApi.ToServerStandardRequestBase, session?: Session): void {
            const freeMem = os.freemem();
            const totalMem = os.totalmem();

            const cpuInfo = os.cpus();
            const cpuLoad = os.loadavg();

            return res({
                success: true,
                payload: {
                    memory: {
                        free: freeMem,
                        total: totalMem,
                    },
                    cpu: {
                        num: cpuInfo.length,
                        load: {
                            minute1: cpuLoad[0],
                            minute5: cpuLoad[1],
                            minute15: cpuLoad[2],
                        },
                    },
                },
            });
        }
    }





    export class MoocchatAttemptApi {
        @ApiDecorators.ApplySession
        public static Post_Start(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerStandardRequestBase, session?: Session): void {
            let attempt: QuizAttempt;

            try {
                attempt = new QuizAttempt(session, true);
            } catch (e) {
                if (e instanceof QuizAttemptExistsInSessionError) {
                    return res({
                        success: false,
                        code: "QUIZ_ATTEMPT_EXISTS_IN_SESSION",
                        message: `Session ID "${session.getId()}" has in-progress or completed quiz attempt; new user session required for new attempt`,
                    });
                }

                throw e;
            }

            return res({
                success: true,
                payload: undefined,
            });
        }

        @ApiDecorators.ApplySession
        public static Post_FSMTransit(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerMoocchatFSMTransition, session?: Session): void {
            let attempt: QuizAttempt;

            try {
                attempt = new QuizAttempt(session);
            } catch (e) {
                if (e instanceof QuizAttemptDoesNotExistError) {
                    return res({
                        success: false,
                        code: "QUIZ_ATTEMPT_DOES_NOT_EXIST",
                        message: `Session ID "${session.getId()}" does not have associated quiz attempt`,
                    });
                }

                if (e instanceof QuizAttemptFSMDoesNotExistError) {
                    return res({
                        success: false,
                        code: "QUIZ_ATTEMPT_ERROR",
                        message: `Session ID "${session.getId()}" quiz attempt does not have FSM`,
                    });
                }

                throw e;
            }

            // TODO: 
            // Perform the transition, then return the resultant state.
            // The result is important, and also if there is something that causes the transition to stop.
            // Any result should be expected to be returned to the client 
            attempt.executeTransition(data.transition);

            // How to get transition result/error?

            attempt.getCurrentState();

            return res({
                success: true,
                payload: undefined,
            });
        }
    }
}




export function handleMongoError<PayloadType>(err: mongodb.MongoError, res: ApiResponseCallback<PayloadType>) {
    if (err) {
        console.error(err);

        res({
            success: false,
            code: "DATABASE_ERROR",
            message: err.message,
        });

        return true;
    }

    return false;
}

export function checkQuestionId(moocchat: Moocchat, session: Session, questionId: string | mongodb.ObjectID, callback: mongodb.MongoCallback<IDB_Question[]>) {
    // Check question ID falls within the course of the session identity
    const course = session.getCourse();

    // Look up question under course
    const db = moocchat.getDb();

    if (typeof questionId === "string") {
        questionId = new Database.ObjectId(questionId);
    }

    new DBQuestion(db).readAsArray({
        _id: questionId,
        course,
    }, callback);
}

export function checkQuizId(moocchat: Moocchat, session: Session, quizId: string | mongodb.ObjectID, callback: mongodb.MongoCallback<IDB_QuizSchedule[]>) {
    // Check quiz ID falls within the course of the session identity
    const course = session.getCourse();

    // Look up quiz under course
    const db = moocchat.getDb();

    if (typeof quizId === "string") {
        quizId = new Database.ObjectId(quizId);
    }

    new DBQuizSchedule(db).readAsArray({
        _id: quizId,
        course,
    }, callback);
}

export function checkUserId(moocchat: Moocchat, session: Session, userId: string | mongodb.ObjectID, callback: mongodb.MongoCallback<IDB_User[]>) {
    // Check user ID falls within the course of the session identity
    const course = session.getCourse();

    // Look up user under course
    const db = moocchat.getDb();

    if (typeof userId === "string") {
        userId = new Database.ObjectId(userId);
    }

    new DBQuizSchedule(db)
        .readWithCursor({
            course,
        })
        .project({
            _id: 1,
        })
        .toArray((err, result) => {
            // TODO: What to do about handling errors?
            //       Probably needs to be held off until Promises are rolled into the codebase
            // if (handleMongoError(err, res)) { return; }
            if (err) {
                console.log(err);
                return;
            }

            const quizIds = result.map((result: { _id: mongodb.ObjectID }) => result._id);

            new DBUserSession(db)
                .readAsArray({
                    quizScheduleId: {
                        $in: quizIds,
                    },
                    userId,
                }, callback);
        });
}

export function checkQuestionOptionIdToQuestionId(moocchat: Moocchat, questionId: string | mongodb.ObjectID, questionOptionId: string | mongodb.ObjectID, callback: mongodb.MongoCallback<IDB_Question[]>) {
    // Look up question under course
    const db = moocchat.getDb();

    if (typeof questionId === "string") {
        questionId = new Database.ObjectId(questionId);
    }

    if (typeof questionOptionId === "string") {
        questionOptionId = new Database.ObjectId(questionOptionId);
    }

    new DBQuestionOption(db).readAsArray({
        _id: questionOptionId,
        questionId,
    }, callback);
}

export function precheckQuizScheduleInsert(moocchat: Moocchat, session: Session, res: ApiResponseCallback<IMoocchatApi.ToClientInsertionIdResponse>, data: IMoocchatApi.ToServerStandardRequestBase & IDB_QuizSchedule, callback: (questionId: mongodb.ObjectID, availableStart: Date, availableEnd: Date) => void) {
    const db = moocchat.getDb();
    const course = session.getCourse();

    // Check valid data
    let questionId: mongodb.ObjectID;
    let availableStart: Date;
    let availableEnd: Date;

    let missingParameters: string[] = [];

    !data.questionId && missingParameters.push("questionId");
    !data.availableStart && missingParameters.push("availableStart");
    !data.availableEnd && missingParameters.push("availableEnd");

    if (missingParameters.length > 0) {
        return res({
            success: false,
            code: "MISSING_PARAMETERS",
            message: `Input missing parameters: ${missingParameters.join(", ")}`
        });
    }

    try {
        // Note that JSON data only has bare primitives, so complex objects and Dates do not exist and must be converted from strings
        // TODO: Need to create a common set of interfaces that is shared for server-side (database) and client-side (JSON)
        questionId = new Database.ObjectId(data.questionId as any as string);
        availableStart = new Date(data.availableStart as any as string);
        availableEnd = new Date(data.availableEnd as any as string);
    } catch (e) {
        return res({
            success: false,
            code: "UNKNOWN_ERROR",  // TODO: Classify error
            message: e.message,
        });
    }

    // Available start and end dates must not be reversed
    if (availableStart > availableEnd) {
        return res({
            success: false,
            code: "QUIZ_AVAILABILITY_DATE_ORDER_INVALID",
            message: `Start availability date must precede end availability date`,
        });
    }

    // Check for scheduling conflicts
    new DBQuizSchedule(db).readWithCursor({
        availableStart: { $lte: availableEnd },
        availableEnd: { $gte: availableStart },
        course,
    }).count(false, (err, result) => {
        if (handleMongoError(err, res)) { return; }

        if (result > 0) {
            return res({
                success: false,
                code: "QUIZ_AVAILABILITY_DATE_CONFLICT",
                message: `Selected quiz availablility date conflicts with existing quiz schedules`
            });
        }

        // Check question ID is usable by course
        checkQuestionId(moocchat, session, questionId, (err, result) => {
            if (handleMongoError(err, res)) { return; }

            // If result blank, that means either question does not exist or
            // is not within the course requested in this session 
            if (result.length === 0) {
                return res({
                    success: false,
                    code: "RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE",
                    message: `Question ID "${questionId}" cannot be found or is not available for the course associated with your current session`
                });
            }

            // Run callback if conditions pass
            callback(
                questionId,
                availableStart,
                availableEnd,
            );
        });
    });
}

export function precheckQuizScheduleUpdate(moocchat: Moocchat, session: Session, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuizId & IDB_QuizSchedule, callback: (questionId: mongodb.ObjectID, availableStart: Date, availableEnd: Date) => void) {
    const db = moocchat.getDb();
    const course = session.getCourse();

    // Check valid data
    const quizId: mongodb.ObjectID = new Database.ObjectId(data.quizId);
    let questionId: mongodb.ObjectID;
    let availableStart: Date;
    let availableEnd: Date;

    try {
        // Note that JSON data only has bare primitives, so complex objects and Dates do not exist and must be converted from strings
        // TODO: Need to create a common set of interfaces that is shared for server-side (database) and client-side (JSON)
        questionId = new Database.ObjectId(data.questionId as any as string);
        availableStart = new Date(data.availableStart as any as string);
        availableEnd = new Date(data.availableEnd as any as string);
    } catch (e) {
        return res({
            success: false,
            code: "UNKNOWN_ERROR",  // TODO: Classify error
            message: e.message,
        });
    }

    // Read existing data
    new DBQuizSchedule(db).readAsArray({
        _id: quizId,
    }, (err, result) => {
        if (handleMongoError(err, res)) { return; }

        const existingQuizSchedule = result[0];

        // Update where given
        !questionId && (questionId = existingQuizSchedule.questionId);
        !availableStart && (availableStart = existingQuizSchedule.availableStart);
        !availableEnd && (availableEnd = existingQuizSchedule.availableEnd);

        // Available start and end dates must not be reversed
        if (availableStart > availableEnd) {
            return res({
                success: false,
                code: "QUIZ_AVAILABILITY_DATE_ORDER_INVALID",
                message: `Start availability date must precede end availability date`,
            });
        }

        // Check for scheduling conflicts
        new DBQuizSchedule(db).readAsArray({
            _id: {
                $ne: quizId        // Should not check against self
            },
            availableStart: { $lte: availableEnd },
            availableEnd: { $gte: availableStart },
            course,
        }, (err, result) => {
            if (handleMongoError(err, res)) { return; }

            if (result.length > 0) {
                return res({
                    success: false,
                    code: "QUIZ_AVAILABILITY_DATE_CONFLICT",
                    message: `Selected quiz availablility date conflicts with existing quiz schedules`
                });
            }

            // Check question ID is usable by course
            checkQuestionId(moocchat, session, questionId, (err, result) => {
                if (handleMongoError(err, res)) { return; }

                // If result blank, that means either question does not exist or
                // is not within the course requested in this session 
                if (result.length === 0) {
                    return res({
                        success: false,
                        code: "RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE",
                        message: `Question ID "${questionId}" cannot be found or is not available for the course associated with your current session`
                    });
                }

                // Run callback if conditions pass
                callback(
                    questionId,
                    availableStart,
                    availableEnd,
                );
            });
        });
    });
}


export function precheckQuestionOptionUpdate(moocchat: Moocchat, session: Session, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuestionOptionId & IMoocchatApi.ToServerQuestionId & IDB_QuestionOption, callback: (content: string, sequence: number) => void) {
    const db = moocchat.getDb();

    // Check valid data
    const questionOptionId: mongodb.ObjectID = new Database.ObjectId(data.questionOptionId);
    const questionId: mongodb.ObjectID = new Database.ObjectId(data.questionId);
    let content: string;
    let sequence: number;

    try {
        // Note that JSON data only has bare primitives, so complex objects and Dates do not exist and must be converted from strings
        // TODO: Need to create a common set of interfaces that is shared for server-side (database) and client-side (JSON)
        if (data.content === "") {
            content = null;
        } else {
            content = data.content;
        }

        if (data.sequence as any as string === "") {
            sequence = null;
        } else if (data.sequence !== null) {
            // Values are cast into int32 or set to undefined (indicating no value set by request)
            if (typeof data.sequence !== "number") {
                sequence = undefined;
            } else {
                sequence = +data.sequence | 0;
            }
        }
    } catch (e) {
        return res({
            success: false,
            code: "UNKNOWN_ERROR",  // TODO: Classify error
            message: e.message,
        });
    }

    // Read existing data
    new DBQuestionOption(db).readAsArray({
        _id: questionOptionId,
        questionId,
    }, (err, result) => {
        if (handleMongoError(err, res)) { return; }

        const existingQuestionOption = result[0];

        // Update where given
        !content && (content = existingQuestionOption.content);
        (sequence === undefined) && (sequence = existingQuestionOption.sequence);

        // Run callback if conditions pass
        callback(
            content,
            sequence,
        );
    });
}




// export type IMoocchatApiHandler<PayloadType> = (data: IMoocchatApi.ToServerBase, session?: Session) => IMoocchatApi.ResponseBase<PayloadType>;

export type ApiResponseCallback<T> = (response: IMoocchatApi.ToClientResponseBase<T>) => void;
export type ApiHandlerBase<InputType extends ToServerStandardRequestBase, PayloadType> = (moocchat: Moocchat, res: ApiResponseCallback<PayloadType>, data: InputType) => void;
export type ApiHandlerWithSession<InputType extends IMoocchatApi.ToServerStandardRequestBase, PayloadType> = (moocchat: Moocchat, res: ApiResponseCallback<PayloadType>, data: InputType, session: Session) => void;

interface SysInfo {
    memory: {
        free: number,
        total: number,
    },
    cpu: {
        num: number,
        load: {
            minute1: number,
            minute5: number,
            minute15: number,
        }
    }
}