import * as mongodb from "mongodb";
import * as os from "os";

import * as ApiDecorators from "./ApiDecorators";

import { Moocchat } from "../Moocchat";

import * as IMoocchatApi from "../../../common/interfaces/IMoocchatApi";
import * as FromClientData from "../../../common/interfaces/FromClientData";

import { ILTIData } from "../../../common/interfaces/ILTIData";
import { LTIAuth } from "../auth/lti/LTIAuth";

import { User as _User } from "../user/User";
import { UserSession as _UserSession } from "../user/UserSession";

import { QuizSchedule as _QuizSchedule } from "../quiz/QuizSchedule";
import { QuizAttempt as _QuizAttempt } from "../quiz/QuizAttempt";

import { User as DBUser, IDB_User } from "../data/models/User";
import { UserSession as DBUserSession, IDB_UserSession } from "../data/models/UserSession";
import { QuizSchedule as DBQuizSchedule, IDB_QuizSchedule } from "../data/models/QuizSchedule";
import { Question as DBQuestion, IDB_Question } from "../data/models/Question";
import { QuizAttempt as DBQuizAttempt, IDB_QuizAttempt } from "../data/models/QuizAttempt";
import { QuestionOption as DBQuestionOption, IDB_QuestionOption } from "../data/models/QuestionOption";
import { QuestionOptionCorrect as DBQuestionOptionCorrect, IDB_QuestionOptionCorrect } from "../data/models/QuestionOptionCorrect";
// import { Survey as DBSurvey, IDB_Survey } from "../data/models/Survey";
import { Mark as DBMark, IDB_Mark } from "../data/models/Mark";
import { ChatGroup as DBChatGroup, IDB_ChatGroup } from "../data/models/ChatGroup";
import { ChatMessage as DBChatMessage, IDB_ChatMessage } from "../data/models/ChatMessage";
import { QuestionResponse as DBQuestionResponse, IDB_QuestionResponse } from "../data/models/QuestionResponse";

import { Utils } from "../../../common/js/Utils";

export namespace Api {
    export class Admin {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Get_PermissionTest(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerStandardRequestBase, session?: _UserSession): void {
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
        public static Gets(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuizSchedule[]>, data: IMoocchatApi.ToServerStandardRequestBase, session?: _UserSession): void {
            const course = session!.getCourse();

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
        public static Gets_NowFuture(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuizSchedule[]>, data: IMoocchatApi.ToServerStandardRequestBase, session?: _UserSession): void {
            const course = session!.getCourse();

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
        public static Get(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuizSchedule>, data: IMoocchatApi.ToServerQuizId, session?: _UserSession): void {
            const db = moocchat.getDb();

            new DBQuizSchedule(db).readAsArray({
                _id: new mongodb.ObjectID(data.quizId)
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
        public static Post(moocchat: Moocchat, res: ApiResponseCallback<IMoocchatApi.ToClientInsertionIdResponse>, data: IMoocchatApi.ToServerStandardRequestBase & IDB_QuizSchedule, session?: _UserSession): void {
            precheckQuizScheduleInsert(moocchat, session!, res, data, (questionId, availableStart, availableEnd) => {
                const db = moocchat.getDb();
                const course = session!.getCourse();

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
        public static Put(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuizId & IDB_QuizSchedule, session?: _UserSession): void {
            precheckQuizScheduleUpdate(moocchat, session!, res, data, (questionId, availableStart, availableEnd) => {
                const db = moocchat.getDb();
                const quizId = data.quizId;

                new DBQuizSchedule(db).updateOne(
                    {
                        _id: new mongodb.ObjectID(quizId),
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
        public static Delete(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuizId, session?: _UserSession): void {
            const db = moocchat.getDb();
            const quizId = data.quizId;

            new DBQuizSchedule(db).delete(
                {
                    _id: new mongodb.ObjectID(quizId),
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
        public static Gets(moocchat: Moocchat, res: ApiResponseCallback<IDB_Question[]>, data: IMoocchatApi.ToServerStandardRequestBase, session?: _UserSession): void {
            const course = session!.getCourse();

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
        public static Get(moocchat: Moocchat, res: ApiResponseCallback<IDB_Question>, data: IMoocchatApi.ToServerQuestionId, session?: _UserSession): void {
            const db = moocchat.getDb();

            new DBQuestion(db).readAsArray({
                _id: new mongodb.ObjectID(data.questionId)
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
        public static Post(moocchat: Moocchat, res: ApiResponseCallback<IMoocchatApi.ToClientInsertionIdResponse>, data: IMoocchatApi.ToServerStandardRequestBase & IDB_Question, session?: _UserSession): void {
            const db = moocchat.getDb();
            const course = session!.getCourse();

            new DBQuestion(db).insertOne({
                title: data.title || "",
                content: data.content || "",
                course,
                systemChatPromptStatements: data.systemChatPromptStatements || null
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
        public static Put(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuestionId & IDB_Question, session?: _UserSession): void {
            const db = moocchat.getDb();
            const questionId = data.questionId;

            const title = data.title === undefined ? undefined : (data.title || "");
            const content = data.content === undefined ? undefined : (data.content || "");
            const systemChatPromptStatements = data.systemChatPromptStatements === undefined? undefined: (data.systemChatPromptStatements || null);
            
            new DBQuestion(db).updateOne(
                {
                    _id: new mongodb.ObjectID(questionId),
                },
                {
                    $set: {
                        title,
                        content,
                        systemChatPromptStatements,
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
        public static Delete(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuestionId, session?: _UserSession): void {
            const db = moocchat.getDb();
            const questionId = data.questionId;

            const _questionId = new mongodb.ObjectID(questionId);

            // Check that there are no quiz schedules with question to be deleted
            new DBQuizSchedule(db).readWithCursor({
                questionId: _questionId
            }).count(false, (err, count) => {
                if (handleMongoError(err, res)) { return; }

                // Reject deletion requests when question in use
                if (count > 0) {
                    return res({
                        success: false,
                        code: "FOREIGN_KEY_CONSTRAINT",
                        message: "Question is in use by one or more quiz schedules; detach question from quiz schedules before deletion",
                    });
                }

                // Delete question
                new DBQuestion(db).delete(
                    {
                        _id: _questionId,
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
    }

    export class QuestionOption {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        @ApiDecorators.LimitQuestionIdToSession
        public static Gets_WithQuestionId(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuestionOption[]>, data: IMoocchatApi.ToServerQuestionId, session?: _UserSession): void {
            const db = moocchat.getDb();

            new DBQuestionOption(db).readAsArray({
                questionId: new mongodb.ObjectID(data.questionId)
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
        public static Post_WithQuestionId(moocchat: Moocchat, res: ApiResponseCallback<IMoocchatApi.ToClientInsertionIdResponse>, data: IMoocchatApi.ToServerQuestionId & IDB_QuestionOption, session?: _UserSession): void {
            const db = moocchat.getDb();

            new DBQuestionOption(db).insertOne({
                content: data.content || "",
                questionId: new mongodb.ObjectID(data.questionId),
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
        public static Put_WithQuestionId(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuestionId & IMoocchatApi.ToServerQuestionOptionId & IDB_QuestionOption, session?: _UserSession): void {
            precheckQuestionOptionUpdate(moocchat, session!, res, data, (content, sequence) => {
                const db = moocchat.getDb();

                new DBQuestionOption(db).updateOne(
                    {
                        _id: new mongodb.ObjectID(data.questionOptionId),
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
        public static Delete_WithQuestionId(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuestionId & IMoocchatApi.ToServerQuestionOptionId, session?: _UserSession): void {
            const db = moocchat.getDb();

            new DBQuestionOption(db).delete(
                {
                    _id: new mongodb.ObjectID(data.questionOptionId),
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
        public static Gets_WithQuestionId(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuestionOptionCorrect[]>, data: IMoocchatApi.ToServerQuestionId, session?: _UserSession): void {
            const db = moocchat.getDb();

            new DBQuestionOptionCorrect(db).readAsArray({
                questionId: new mongodb.ObjectID(data.questionId)
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
        public static Get(moocchat: Moocchat, res: ApiResponseCallback<IDB_User>, data: IMoocchatApi.ToServerUserId, session?: _UserSession): void {
            const db = moocchat.getDb();

            new DBUser(db).readAsArray({
                _id: new mongodb.ObjectID(data.userId)
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
        public static Get_WithSessionId(moocchat: Moocchat, res: ApiResponseCallback<IDB_User>, data: IMoocchatApi.ToServerUserId, session?: _UserSession): void {
            const db = moocchat.getDb();

            new DBUserSession(db).readAsArray({
                _id: new mongodb.ObjectID(data.sessionId)
            }, (err, result) => {
                if (handleMongoError(err, res)) { return; }

                if(result.length === 0) {
                    return res({
                        success: false,
                        code: "RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE",
                        message: "User not found"
                    })
                }
                const fetchedSession = result[0];
                new DBUser(db).readAsArray({
                    _id: fetchedSession.userId
                }, (err, result) => {
                    if(result.length === 0) {
                        return res({
                            success: false,
                            code: "RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE",
                            message: "User not found"
                        })
                    }
                    const fetchedUser = result[0];
                    return res({
                        success: true,
                        payload: fetchedUser,
                    });
                })
                
            });
        }


        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Get_Multiple_Markers_Mode(moocchat: Moocchat, res: ApiResponseCallback<IDB_User>, data: IMoocchatApi.ToServerUserId, session?: _UserSession): void {
            const db = moocchat.getDb();

            new DBUser(db).readAsArray({
                _id: new mongodb.ObjectID(data.userId)
            }, (err, result) => {
                if (handleMongoError(err, res)) { return; }

                if(result.length === 0) {
                    return res({
                        success: false,
                        code: "RESOURCE_NOT_FOUND_OR_NOT_ACCESSIBLE",
                        message: "User not found"
                    })
                }

                const fetchedUser = result[0];

                return res({
                    success: true,
                    payload: fetchedUser,
                });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Gets(moocchat: Moocchat, res: ApiResponseCallback<IDB_User[]>, data: IMoocchatApi.ToServerStandardRequestBase, session?: _UserSession): void {
            const course = session!.getCourse();
            
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
        public static Gets_WithUserId(moocchat: Moocchat, res: ApiResponseCallback<IDB_UserSession[]>, data: IMoocchatApi.ToServerUserId, session?: _UserSession): void {
            const db = moocchat.getDb();

            new DBUserSession(db)
                .readAsArray({
                    userId: new mongodb.ObjectID(data.userId)
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
                return res({
                    success: false,
                    code: "AUTHENTICATION_FAILED",
                    message: authResult.message || "",
                });
            }

            // Set up session
            (async () => {
                const db = moocchat.getDb();
                const identity = authObj.getIdentity();

                const user = await _User.GetAutoFetchAutoCreate(db, identity);

                const adminRoles = [
                    "instructor",
                    "teachingassistant",
                    "administrator",
                ];

                const isAdmin = (identity.roles || []).some(role => {
                    return Utils.Array.includes(adminRoles, role.toLowerCase());
                });

                const session = await _UserSession.Create(db, user, isAdmin ? "ADMIN" : "STUDENT", identity.course!);

                return res({
                    success: true,
                    payload: {
                        sessionId: session.getId(),
                        timeout: _UserSession.Timeout,
                    }
                });
            })().catch((e) => {
                console.error(e);

                return res({
                    success: false,
                    code: "SESSION_INITIALISATION_FAILED",
                    message: e.toString(),
                });
            });
        }

        @ApiDecorators.ApplySession
        public static Delete(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerStandardRequestBase, session?: _UserSession): void {
            (async () => {
                await session!.end();
                session!.destroyInstance();

                return res({
                    success: true,
                    payload: undefined,
                });
            })().catch((e) => {
                console.error(e);

                return res({
                    success: false,
                    code: "UNKNOWN_ERROR",
                    message: e.toString(),
                });
            });
        }
    }

    export class System {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Get_Info(moocchat: Moocchat, res: ApiResponseCallback<SysInfo>, data: IMoocchatApi.ToServerStandardRequestBase, session?: _UserSession): void {
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

    export class Mark {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Gets_WithQuizId(moocchat: Moocchat, res: ApiResponseCallback<IDB_Mark[]>, data: IMoocchatApi.ToServerQuizId, session?: _UserSession): void {
            const db = moocchat.getDb();

            (async () => {
                const quizScheduleId = data.quizId!;

                // Look up quiz course; check course matches admin course
                const quizSchedule = await _QuizSchedule.GetAutoFetch(db, quizScheduleId);

                if (!quizSchedule) {
                    throw new Error();      // TODO:
                }

                const markerSessionCourse = session!.getCourse();
                const quizCourse = quizSchedule.getData().course!;

                if (markerSessionCourse !== quizCourse) {
                    throw new Error(`Marker session course "${markerSessionCourse}" does not match quiz schedule course "${quizCourse}"`);
                }

                // Get marks related to quiz attempts for the specified quiz schedule

                new DBQuizAttempt(db)
                    .readWithCursor({
                        quizScheduleId: quizSchedule.getOID(),
                    })
                    .project({
                        _id: 1,
                    })
                    .toArray((err, result) => {
                        if (handleMongoError(err, res)) { return; }

                        const quizAttemptIds = result.map((result: { _id: mongodb.ObjectID }) => result._id);

                        new DBMark(db).readAsArray({
                            quizAttemptId: {
                                $in: quizAttemptIds,
                            },
                            invalidated: null,
                        }, (err, result) => {
                            if (handleMongoError(err, res)) { return; }

                            return res({
                                success: true,
                                payload: result,
                            });
                        });
                    });
            })().catch((e) => {
                console.error(e);

                return res({
                    success: false,
                    code: "UNKNOWN_ERROR",
                    message: e.toString(),
                });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Gets_WithQuizAttemptId(moocchat: Moocchat, res: ApiResponseCallback<IDB_Mark>, data: IMoocchatApi.ToServerQuizAttemptId, session?: _UserSession): void {
            const db = moocchat.getDb();

            (async () => {
                const quizAttemptId = data.quizAttemptId!;

                const quizAttempt = await _QuizAttempt.GetAutoFetch(db, quizAttemptId);

                if (!quizAttempt) {
                    throw new Error();      // TODO:
                }

                // Look up quiz course; check course matches admin course
                const markerSessionCourse = session!.getCourse();
                const quizCourse = quizAttempt.getQuizSchedule().getData().course!;

                if (markerSessionCourse !== quizCourse) {
                    throw new Error(`Marker session course "${markerSessionCourse}" does not match quiz schedule course "${quizCourse}"`);
                }

                // Get mark for quiz attempt
                new DBMark(db).readAsArray({
                    quizAttemptId: quizAttempt.getOID(),
                    invalidated: null,
                }, (err, result) => {
                    if (handleMongoError(err, res)) { return; }

                    return res({
                        success: true,
                        payload: result[0],
                    });
                });
            })().catch((e) => {
                console.error(e);

                return res({
                    success: false,
                    code: "UNKNOWN_ERROR",
                    message: e.toString(),
                });
            });
        }



        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Gets_WithQuizAttemptId_Multiple_Markers_Mode(moocchat: Moocchat, res: ApiResponseCallback<IDB_Mark>, data: IMoocchatApi.ToServerQuizAttemptId, session?: _UserSession): void {
            const db = moocchat.getDb();

            (async () => {
                const quizAttemptId = data.quizAttemptId!;

                const quizAttempt = await _QuizAttempt.GetAutoFetch(db, quizAttemptId);

                if (!quizAttempt) {
                    throw new Error();      // TODO:
                }

                // Look up quiz course; check course matches admin course
                const markerSessionCourse = session!.getCourse();
                const quizCourse = quizAttempt.getQuizSchedule().getData().course!;
                const markerId = session!.getUser().getData()._id;

                if (markerSessionCourse !== quizCourse) {
                    throw new Error(`Marker session course "${markerSessionCourse}" does not match quiz schedule course "${quizCourse}"`);
                }

                // Get mark for quiz attempt
                new DBMark(db).readAsArray({
                    quizAttemptId: quizAttempt.getOID(),
                    markerId: markerId,
                    invalidated: null,
                }, (err, result) => {
                    if (handleMongoError(err, res)) { return; }

                    return res({
                        success: true,
                        payload: result[0],
                    });
                });
            })().catch((e) => {
                console.error(e);

                return res({
                    success: false,
                    code: "UNKNOWN_ERROR",
                    message: e.toString(),
                });
            });
        }

        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Post(moocchat: Moocchat, res: ApiResponseCallback<IMoocchatApi.ToClientInsertionIdResponse>, data: IMoocchatApi.ToServerStandardRequestBase & FromClientData.Mark, session?: _UserSession): void {
            const db = moocchat.getDb();

            let missingParameters: string[] = [];

            !data.method && missingParameters.push("method");
            !data.quizAttemptId && missingParameters.push("quizAttemptId");
            (data.value !== 0 && !data.value) && missingParameters.push("value");

            if (missingParameters.length > 0) {
                return res({
                    success: false,
                    code: "MISSING_PARAMETERS",
                    message: `Input missing parameters: ${missingParameters.join(", ")}`
                });
            }

            (async () => {
                // Look up quiz attempt ID being marked and check that the course is equal to the marker user session course
                const quizAttemptId = data.quizAttemptId!;
                const quizAttempt = await _QuizAttempt.GetAutoFetch(db, quizAttemptId);

                if (!quizAttempt) {
                    throw new Error(`Quiz attempt ID "${quizAttemptId}" cannot be found`);
                }

                const markerSessionCourse = session!.getCourse();
                const quizAttemptCourse = quizAttempt.getQuizSchedule().getData().course;

                if (markerSessionCourse !== quizAttemptCourse) {
                    throw new Error(`Marker session course "${markerSessionCourse}" does not match marked quiz attempt course "${quizAttemptCourse}"`);
                }

                // Set previous marks invalid
                new DBMark(db).getCollection().updateMany(
                    {
                        quizAttemptId: quizAttempt.getOID(),
                        invalidated: null,
                    },
                    {
                        $set: {
                            invalidated: new Date(),
                        },
                    },
                    (err, result) => {
                        if (handleMongoError(err, res)) { return; }

                        new DBMark(db).insertOne({
                            method: data.method,
                            markerUserSessionId: session!.getOID(),
                            quizAttemptId: quizAttempt.getOID(),
                            value: data.value,
                            timestamp: new Date(),
                            invalidated: null
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
                );
            })().catch((e) => {
                console.error(e);

                return res({
                    success: false,
                    code: "UNKNOWN_ERROR",
                    message: e.toString(),
                });
            });
        }




        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Post_Multiple_Markers_Mode(moocchat: Moocchat, res: ApiResponseCallback<IMoocchatApi.ToClientInsertionIdResponse>, data: IMoocchatApi.ToServerStandardRequestBase & FromClientData.Mark, session?: _UserSession): void {
            const db = moocchat.getDb();

            let missingParameters: string[] = [];

            !data.method && missingParameters.push("method");
            !data.quizAttemptId && missingParameters.push("quizAttemptId");
            (data.value !== 0 && !data.value) && missingParameters.push("value");

            if (missingParameters.length > 0) {
                return res({
                    success: false,
                    code: "MISSING_PARAMETERS",
                    message: `Input missing parameters: ${missingParameters.join(", ")}`
                });
            }

            (async () => {
                // Look up quiz attempt ID being marked and check that the course is equal to the marker user session course
                const quizAttemptId = data.quizAttemptId!;
                const quizAttempt = await _QuizAttempt.GetAutoFetch(db, quizAttemptId);

                if (!quizAttempt) {
                    throw new Error(`Quiz attempt ID "${quizAttemptId}" cannot be found`);
                }

                const markerSessionCourse = session!.getCourse();
                const quizAttemptCourse = quizAttempt.getQuizSchedule().getData().course;
                const markerId = session!.getUser().getData()._id;

                if (markerSessionCourse !== quizAttemptCourse) {
                    throw new Error(`Marker session course "${markerSessionCourse}" does not match marked quiz attempt course "${quizAttemptCourse}"`);
                }

                // Set previous marks invalid
                new DBMark(db).getCollection().updateMany(
                    {
                        quizAttemptId: quizAttempt.getOID(),
                        markerId: markerId,
                        invalidated: null,
                    },
                    {
                        $set: {
                            invalidated: new Date(),
                        },
                    },
                    (err, result) => {
                        if (handleMongoError(err, res)) { return; }

                        new DBMark(db).insertOne({
                            method: data.method,
                            markerUserSessionId: session!.getOID(),
                            quizAttemptId: quizAttempt.getOID(),
                            value: data.value,
                            timestamp: new Date(),
                            invalidated: null,
                            markerId: markerId
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
                );
            })().catch((e) => {
                console.error(e);

                return res({
                    success: false,
                    code: "UNKNOWN_ERROR",
                    message: e.toString(),
                });
            });
        }
    }

    export class QuizAttempt_User {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Gets_WithQuizId(moocchat: Moocchat, res: ApiResponseCallback<any[]>, data: IMoocchatApi.ToServerQuizId, session?: _UserSession): void {
            const db = moocchat.getDb();

            (async () => {
                const quizScheduleId = data.quizId!;

                // Look up quiz course; check course matches admin course
                const quizSchedule = await _QuizSchedule.GetAutoFetch(db, quizScheduleId);

                if (!quizSchedule) {
                    throw new Error();      // TODO:
                }

                const markerSessionCourse = session!.getCourse();
                const quizCourse = quizSchedule.getData().course!;

                if (markerSessionCourse !== quizCourse) {
                    throw new Error(`Marker session course "${markerSessionCourse}" does not match quiz schedule course "${quizCourse}"`);
                }

                // Get quiz attempts and pair them up with user information

                new DBQuizAttempt(db).readAsArray({
                    quizScheduleId: quizSchedule.getOID(),
                }, (err, quizAttempts) => {
                    if (handleMongoError(err, res)) { return; }

                    const userSessionIds = quizAttempts.map(result => result.userSessionId);

                    new DBUserSession(db).readAsArray({
                        _id: {
                            $in: userSessionIds,
                        }
                    }, (err, userSessions) => {
                        if (handleMongoError(err, res)) { return; }

                        // Map user session IDs to user IDs
                        const userSessionToUser: { [userSessionId: string]: mongodb.ObjectID } = {};
                        const userIds: mongodb.ObjectID[] = [];

                        userSessions.forEach((userSession) => {
                            userSessionToUser[userSession._id!.toHexString()] = userSession.userId!;
                            userIds.push(userSession.userId!);
                        })

                        new DBUser(db).readAsArray({
                            _id: {
                                $in: userIds,
                            }
                        }, (err, users) => {
                            if (handleMongoError(err, res)) { return; }

                            // Convert array to lookup
                            const userLookup: { [id: string]: IDB_User } = {};

                            users.forEach((user) => {
                                userLookup[user._id!.toHexString()] = user;
                            });

                            // Return quiz attempts with user info under `_user`
                            (<any[]>quizAttempts).forEach((quizAttempt) => {
                                quizAttempt["_user"] = userLookup[userSessionToUser[quizAttempt.userSessionId!.toHexString()].toHexString()];
                            });

                            return res({
                                success: true,
                                payload: quizAttempts,
                            });
                        });
                    });
                });
            })().catch((e) => {
                console.error(e);

                return res({
                    success: false,
                    code: "UNKNOWN_ERROR",
                    message: e.toString(),
                });
            });
        }
    }

    export class ChatGroup {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Gets_WithQuizId(moocchat: Moocchat, res: ApiResponseCallback<IDB_ChatGroup[]>, data: IMoocchatApi.ToServerQuizId, session?: _UserSession): void {
            const db = moocchat.getDb();

            (async () => {
                const quizScheduleId = data.quizId!;

                // Look up quiz course; check course matches admin course
                const quizSchedule = await _QuizSchedule.GetAutoFetch(db, quizScheduleId);

                if (!quizSchedule) {
                    throw new Error();      // TODO:
                }

                const markerSessionCourse = session!.getCourse();
                const quizCourse = quizSchedule.getData().course!;

                if (markerSessionCourse !== quizCourse) {
                    throw new Error(`Marker session course "${markerSessionCourse}" does not match quiz schedule course "${quizCourse}"`);
                }

                // Get all chat groups with quiz schedule
                new DBChatGroup(db).readAsArray({
                    quizScheduleId: quizSchedule.getOID(),
                }, (err, result) => {
                    if (handleMongoError(err, res)) { return; }

                    return res({
                        success: true,
                        payload: result,
                    });
                });
            })().catch((e) => {
                console.error(e);

                return res({
                    success: false,
                    code: "UNKNOWN_ERROR",
                    message: e.toString(),
                });
            });
        }
    }

    export class ChatMessage {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Gets_WithQuizId(moocchat: Moocchat, res: ApiResponseCallback<IDB_ChatMessage[]>, data: IMoocchatApi.ToServerQuizId, session?: _UserSession): void {
            const db = moocchat.getDb();

            (async () => {
                const quizScheduleId = data.quizId!;

                // Look up quiz course; check course matches admin course
                const quizSchedule = await _QuizSchedule.GetAutoFetch(db, quizScheduleId);

                if (!quizSchedule) {
                    throw new Error();      // TODO:
                }

                const markerSessionCourse = session!.getCourse();
                const quizCourse = quizSchedule.getData().course!;

                if (markerSessionCourse !== quizCourse) {
                    throw new Error(`Marker session course "${markerSessionCourse}" does not match quiz schedule course "${quizCourse}"`);
                }

                // Get chat messages related to quiz attempts for the specified quiz schedule

                new DBQuizAttempt(db)
                    .readWithCursor({
                        quizScheduleId: quizSchedule.getOID(),
                    })
                    .project({
                        _id: 1,
                    })
                    .toArray((err, result) => {
                        if (handleMongoError(err, res)) { return; }

                        const quizAttemptIds = result.map((result: { _id: mongodb.ObjectID }) => result._id);

                        new DBChatMessage(db).readAsArray({
                            quizAttemptId: {
                                $in: quizAttemptIds,
                            },
                        }, (err, result) => {
                            if (handleMongoError(err, res)) { return; }

                            return res({
                                success: true,
                                payload: result,
                            });
                        });
                    });
            })().catch((e) => {
                console.error(e);

                return res({
                    success: false,
                    code: "UNKNOWN_ERROR",
                    message: e.toString(),
                });
            });
        }
    }

    export class QuestionResponse {
        @ApiDecorators.ApplySession
        @ApiDecorators.AdminOnly
        public static Gets_WithQuizId(moocchat: Moocchat, res: ApiResponseCallback<IDB_QuestionResponse[]>, data: IMoocchatApi.ToServerQuizId, session?: _UserSession): void {
            const db = moocchat.getDb();

            (async () => {
                const quizScheduleId = data.quizId!;

                // Look up quiz course; check course matches admin course
                const quizSchedule = await _QuizSchedule.GetAutoFetch(db, quizScheduleId);

                if (!quizSchedule) {
                    throw new Error();      // TODO:
                }

                const markerSessionCourse = session!.getCourse();
                const quizCourse = quizSchedule.getData().course!;

                if (markerSessionCourse !== quizCourse) {
                    throw new Error(`Marker session course "${markerSessionCourse}" does not match quiz schedule course "${quizCourse}"`);
                }

                // Get marks related to quiz attempts for the specified quiz schedule

                new DBQuizAttempt(db)
                    .readWithCursor({
                        quizScheduleId: quizSchedule.getOID(),
                    })
                    .project({
                        _id: 0,
                        responseInitialId: 1,
                        responseFinalId: 1,
                    })
                    .toArray((err, result) => {
                        if (handleMongoError(err, res)) { return; }

                        const questionResponseIds: mongodb.ObjectID[] = [];

                        result.forEach((quizAttempt: IDB_QuizAttempt) => {
                            if (quizAttempt.responseInitialId) {
                                questionResponseIds.push(quizAttempt.responseInitialId);
                            }

                            if (quizAttempt.responseFinalId) {
                                questionResponseIds.push(quizAttempt.responseFinalId);
                            }
                        });

                        new DBQuestionResponse(db).readAsArray({
                            _id: {
                                $in: questionResponseIds,
                            },
                        }, (err, result) => {
                            if (handleMongoError(err, res)) { return; }

                            return res({
                                success: true,
                                payload: result,
                            });
                        });
                    });
            })().catch((e) => {
                console.error(e);

                return res({
                    success: false,
                    code: "UNKNOWN_ERROR",
                    message: e.toString(),
                });
            });
        }
    }


    // export class MoocchatAttemptApi {
    //     @ApiDecorators.ApplySession
    //     public static Post_Start(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerStandardRequestBase, session?: _UserSession): void {
    //         let attempt: QuizAttempt;

    //         try {
    //             attempt = new QuizAttempt(session, true);
    //         } catch (e) {
    //             if (e instanceof QuizAttemptExistsInSessionError) {
    //                 return res({
    //                     success: false,
    //                     code: "QUIZ_ATTEMPT_EXISTS_IN_SESSION",
    //                     message: `Session ID "${session.getId()}" has in-progress or completed quiz attempt; new user session required for new attempt`,
    //                 });
    //             }

    //             throw e;
    //         }

    //         return res({
    //             success: true,
    //             payload: undefined,
    //         });
    //     }

    //     @ApiDecorators.ApplySession
    //     public static Post_FSMTransit(moocchat: Moocchat, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerMoocchatFSMTransition, session?: _UserSession): void {
    //         let attempt: QuizAttempt;

    //         try {
    //             attempt = new QuizAttempt(session);
    //         } catch (e) {
    //             if (e instanceof QuizAttemptDoesNotExistError) {
    //                 return res({
    //                     success: false,
    //                     code: "QUIZ_ATTEMPT_DOES_NOT_EXIST",
    //                     message: `Session ID "${session.getId()}" does not have associated quiz attempt`,
    //                 });
    //             }

    //             if (e instanceof QuizAttemptFSMDoesNotExistError) {
    //                 return res({
    //                     success: false,
    //                     code: "QUIZ_ATTEMPT_ERROR",
    //                     message: `Session ID "${session.getId()}" quiz attempt does not have FSM`,
    //                 });
    //             }

    //             throw e;
    //         }

    //         // TODO: 
    //         // Perform the transition, then return the resultant state.
    //         // The result is important, and also if there is something that causes the transition to stop.
    //         // Any result should be expected to be returned to the client 
    //         attempt.executeTransition(data.transition);

    //         // How to get transition result/error?

    //         attempt.getCurrentState();

    //         return res({
    //             success: true,
    //             payload: undefined,
    //         });
    //     }
    // }
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

export function checkQuestionId(moocchat: Moocchat, session: _UserSession, questionId: string | mongodb.ObjectID, callback: mongodb.MongoCallback<IDB_Question[]>) {
    // Check question ID falls within the course of the session identity
    const course = session.getCourse();

    // Look up question under course
    const db = moocchat.getDb();

    if (typeof questionId === "string") {
        questionId = new mongodb.ObjectID(questionId);
    }

    new DBQuestion(db).readAsArray({
        _id: questionId,
        course,
    }, callback);
}

export function checkQuizId(moocchat: Moocchat, session: _UserSession, quizId: string | mongodb.ObjectID, callback: mongodb.MongoCallback<IDB_QuizSchedule[]>) {
    // Check quiz ID falls within the course of the session identity
    const course = session.getCourse();

    // Look up quiz under course
    const db = moocchat.getDb();

    if (typeof quizId === "string") {
        quizId = new mongodb.ObjectID(quizId);
    }

    new DBQuizSchedule(db).readAsArray({
        _id: quizId,
        course,
    }, callback);
}

export function checkUserId(moocchat: Moocchat, session: _UserSession, userId: string | mongodb.ObjectID, callback: mongodb.MongoCallback<IDB_User[]>) {
    // Check user ID falls within the course of the session identity
    const course = session.getCourse();

    // Look up user under course
    const db = moocchat.getDb();

    if (typeof userId === "string") {
        userId = new mongodb.ObjectID(userId);
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
        questionId = new mongodb.ObjectID(questionId);
    }

    if (typeof questionOptionId === "string") {
        questionOptionId = new mongodb.ObjectID(questionOptionId);
    }

    new DBQuestionOption(db).readAsArray({
        _id: questionOptionId,
        questionId,
    }, callback);
}

export function precheckQuizScheduleInsert(moocchat: Moocchat, session: _UserSession, res: ApiResponseCallback<IMoocchatApi.ToClientInsertionIdResponse>, data: IMoocchatApi.ToServerStandardRequestBase & IDB_QuizSchedule, callback: (questionId: mongodb.ObjectID, availableStart: Date, availableEnd: Date) => void) {
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
        questionId = new mongodb.ObjectID(data.questionId as any as string);
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

export function precheckQuizScheduleUpdate(moocchat: Moocchat, session: _UserSession, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuizId & IDB_QuizSchedule, callback: (questionId: mongodb.ObjectID, availableStart: Date, availableEnd: Date) => void) {
    const db = moocchat.getDb();
    const course = session.getCourse();

    // Check valid data
    const quizId: mongodb.ObjectID = new mongodb.ObjectID(data.quizId);
    let questionId: mongodb.ObjectID;
    let availableStart: Date;
    let availableEnd: Date;

    try {
        // Note that JSON data only has bare primitives, so complex objects and Dates do not exist and must be converted from strings
        // TODO: Need to create a common set of interfaces that is shared for server-side (database) and client-side (JSON)
        questionId = new mongodb.ObjectID(data.questionId as any as string);
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
        !questionId && (questionId = existingQuizSchedule.questionId!);
        !availableStart && (availableStart = existingQuizSchedule.availableStart!);
        !availableEnd && (availableEnd = existingQuizSchedule.availableEnd!);

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


export function precheckQuestionOptionUpdate(moocchat: Moocchat, session: _UserSession, res: ApiResponseCallback<void>, data: IMoocchatApi.ToServerQuestionOptionId & IMoocchatApi.ToServerQuestionId & IDB_QuestionOption, callback: (content: string, sequence: number | null) => void) {
    const db = moocchat.getDb();

    // Check valid data
    const questionOptionId: mongodb.ObjectID = new mongodb.ObjectID(data.questionOptionId);
    const questionId: mongodb.ObjectID = new mongodb.ObjectID(data.questionId);
    let content: string | null | undefined;
    let sequence: number | null | undefined;

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
        !content && (content = existingQuestionOption.content!);
        (sequence === undefined) && (sequence = existingQuestionOption.sequence!);

        // Run callback if conditions pass
        callback(
            content,
            sequence,
        );
    });
}




// export type IMoocchatApiHandler<PayloadType> = (data: IMoocchatApi.ToServerBase, session?: _UserSession) => IMoocchatApi.ResponseBase<PayloadType>;

export type ApiResponseCallback<T> = (response: IMoocchatApi.ToClientResponseBase<T>) => void;
export type ApiHandlerBase<InputType extends IMoocchatApi.ToServerStandardRequestBase, PayloadType> = (moocchat: Moocchat, res: ApiResponseCallback<PayloadType>, data: InputType) => void;
export type ApiHandlerWithSession<InputType extends IMoocchatApi.ToServerStandardRequestBase, PayloadType> = (moocchat: Moocchat, res: ApiResponseCallback<PayloadType>, data: InputType, session: _UserSession) => void;

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