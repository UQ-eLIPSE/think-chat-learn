import * as mongodb from "mongodb";
import { Database } from "../data/Database";
import { QuizAttempt as DBQuizAttempt, IDB_QuizAttempt } from "../data/models/QuizAttempt";

import { KVStore } from "../../../common/js/KVStore";

import { User } from "../user/User";

// Refers to...
import { UserSession } from "../user/UserSession";
import { QuizSchedule } from "./QuizSchedule";
import { QuestionResponse } from "../question/QuestionResponse";

// Referred to by...
import { SurveyResponse } from "../survey/SurveyResponse";

export class QuizAttempt {
    private static readonly Store = new KVStore<QuizAttempt>();

    private data: IDB_QuizAttempt;
    private readonly userSession: UserSession;
    private readonly quizSchedule: QuizSchedule;
    private responseInitial: QuestionResponse | undefined;
    private responseFinal: QuestionResponse | undefined;

    private readonly db: mongodb.Db;

    public static GetWithResponseInitial(responseInitial: QuestionResponse) {
        return QuizAttempt.Store.getValues().filter(quizAttempt => quizAttempt.getResponseInitial() === responseInitial);
    }

    public static GetWithResponseFinal(responseFinal: QuestionResponse) {
        return QuizAttempt.Store.getValues().filter(quizAttempt => quizAttempt.getResponseFinal() === responseFinal);
    }

    public static GetWithUserSession(userSession: UserSession) {
        return QuizAttempt.Store.getValues().filter(quizAttempt => quizAttempt.getUserSession() === userSession);
    }

    public static GetWithQuizSchedule(quizSchedule: QuizSchedule) {
        return QuizAttempt.Store.getValues().filter(quizAttempt => quizAttempt.getQuizSchedule() === quizSchedule);
    }

    public static async GetAutoFetch(db: mongodb.Db, quizAttemptId: string) {
        const quizAttempt = QuizAttempt.Get(quizAttemptId);

        if (quizAttempt) {
            return quizAttempt;
        }

        return await QuizAttempt.Fetch(db, quizAttemptId);
    }

    public static Get(quizAttemptId: string) {
        return QuizAttempt.Store.get(quizAttemptId);
    }

    public static async Fetch(db: mongodb.Db, quizAttemptId: string): Promise<QuizAttempt | undefined> {
        const dbQuizAttempt = new DBQuizAttempt(db).getCollection();

        let quizAttempt: IDB_QuizAttempt | null = await dbQuizAttempt.findOne(
            {
                _id: new mongodb.ObjectID(quizAttemptId),
            }
        );

        if (!quizAttempt) {
            return undefined;
        }

        const userSession = await UserSession.GetAutoFetch(db, quizAttempt.userSessionId.toHexString());

        if (!userSession) {
            throw new Error(`User session "${quizAttempt.userSessionId.toHexString()}" missing for quiz attempt "${quizAttempt._id.toHexString()}"`)
        }

        const quizSchedule = await QuizSchedule.GetAutoFetch(db, quizAttempt.quizScheduleId.toHexString());

        if (!quizSchedule) {
            throw new Error(`Quiz schedule "${quizAttempt.quizScheduleId.toHexString()}" missing for quiz attempt "${quizAttempt._id.toHexString()}"`)
        }


        const quizAttemptObj = new QuizAttempt(db, quizAttempt, userSession, quizSchedule);


        if (quizAttempt.responseInitialId) {
            const responseInitial = await QuestionResponse.GetAutoFetch(db, quizAttempt.responseInitialId.toHexString());

            if (!responseInitial) {
                throw new Error(`Response initial "${quizAttempt.responseInitialId.toHexString()}" missing for quiz attempt "${quizAttempt._id.toHexString()}"`)
            }

            quizAttemptObj.responseInitial = responseInitial;
        }

        if (quizAttempt.responseFinalId) {
            const responseFinal = await QuestionResponse.GetAutoFetch(db, quizAttempt.responseFinalId.toHexString());

            if (!responseFinal) {
                throw new Error(`Response final "${quizAttempt.responseFinalId.toHexString()}" missing for quiz attempt "${quizAttempt._id.toHexString()}"`)
            }

            quizAttemptObj.responseFinal = responseFinal;
        }

        return quizAttemptObj;
    }

    public static async HasPreviouslyCompleted(db: mongodb.Db, quizSchedule: QuizSchedule, user: User) {
        const userSessions = await UserSession.FetchSessions(db, user);

        if (userSessions.length === 0) {
            return false;
        }

        const userSessionOIDs = userSessions.map(userSession => userSession.getOID());

        const dbQuizAttempt = new DBQuizAttempt(db).getCollection();

        const cursor = dbQuizAttempt.find({
            userSessionId: { $in: userSessionOIDs },
            quizScheduleId: quizSchedule.getOID(),
            responseInitialId: { $ne: null },
            responseFinalId: { $ne: null }
        });

        // Count number of records up to 1 (we don't care about the actual number)
        const recordExistsCount = await cursor.count(true, { limit: 1 });

        return recordExistsCount === 1;
    }

    public static async Create(db: mongodb.Db, userSession: UserSession, quizSchedule: QuizSchedule) {
        const dbQuizAttempt = new DBQuizAttempt(db).getCollection();

        const newQuizAttemptData: IDB_QuizAttempt = {
            _id: Database.GenerateRandomOID(),
            userSessionId: userSession.getOID(),
            quizScheduleId: quizSchedule.getOID(),
            responseInitialId: null,
            responseFinalId: null,
        }

        await dbQuizAttempt.insertOne(newQuizAttemptData);

        return new QuizAttempt(db, newQuizAttemptData, userSession, quizSchedule);
    }

    private static async Update(quizAttempt: QuizAttempt, updateData: IDB_QuizAttempt) {
        const dbUser = new DBQuizAttempt(quizAttempt.getDb()).getCollection();

        const result = await dbUser.findOneAndUpdate(
            {
                _id: quizAttempt.getOID(),
            },
            {
                $set: updateData,
            },
            {
                returnOriginal: false,
            }
        );

        // Update data for this object
        quizAttempt.data = result.value;
    }

    private constructor(db: mongodb.Db, data: IDB_QuizAttempt, userSession: UserSession, quizSchedule: QuizSchedule) {
        this.data = data;
        this.userSession = userSession;
        this.quizSchedule = quizSchedule;
        this.db = db;

        this.addToStore();
    }

    private getDb() {
        return this.db;
    }

    public getOID() {
        return this.data._id;
    }

    public getId() {
        return this.data._id.toHexString();
    }

    public getUserSession() {
        return this.userSession;
    }

    public getQuizSchedule() {
        return this.quizSchedule;
    }

    public getResponseInitial() {
        return this.responseInitial;
    }

    public getResponseFinal() {
        return this.responseFinal;
    }

    public async setQuizResponse(type: "initial" | "final", response: QuestionResponse) {
        let updateObj: { [key: string]: mongodb.ObjectID } = {};

        if (type === "initial") {
            updateObj["responseInitialId"] = response.getOID();
        } else if (type === "final") {
            updateObj["responseFinalId"] = response.getOID();
        } else {
            throw new Error(`Unrecognised response type "${type}"`);
        }

        await QuizAttempt.Update(this, updateObj);

        if (type === "initial") {
            this.responseInitial = response;
        } else if (type === "final") {
            this.responseFinal = response;
        }
    }

    private addToStore() {
        QuizAttempt.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        QuizAttempt.Store.delete(this.getId());
    }

    public async destroyInstance() {
        this.removeFromStore();

        // Remove related objects
        SurveyResponse.GetWithQuizAttempt(this).forEach(_ => _.destroyInstance());
    }
}