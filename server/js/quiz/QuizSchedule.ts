import * as mongodb from "mongodb";
import { QuizSchedule as DBQuizSchedule, IDB_QuizSchedule } from "../data/models/QuizSchedule";

import { KVStore } from "../../../common/js/KVStore";

// Refers to...
import { Question } from "../question/Question";

// Referred to by...
import { QuizAttempt } from "./QuizAttempt";

export class QuizSchedule {
    private static readonly Store = new KVStore<QuizSchedule>();

    private data: IDB_QuizSchedule;
    private readonly question: Question;

    private readonly db: mongodb.Db;

    public static Get(quizScheduleId: string) {
        return QuizSchedule.Store.get(quizScheduleId);
    }

    public static GetWith(question: Question) {
        return QuizSchedule.Store.getValues().filter(quizSchedule => quizSchedule.getQuestion() === question);
    }

    public static async GetAutoFetch(db: mongodb.Db, quizScheduleId: string) {
        const quizSchedule = QuizSchedule.Get(quizScheduleId);

        if (quizSchedule) {
            return quizSchedule;
        }

        return await QuizSchedule.Fetch(db, quizScheduleId);
    }

    public static async Create(db: mongodb.Db, data: IDB_QuizSchedule, question: Question) {
        const dbQuizSchedule = new DBQuizSchedule(db).getCollection();

        data.questionId = question.getOID();

        await dbQuizSchedule.insertOne(data);

        return new QuizSchedule(db, data, question);
    }

    public static async Fetch(db: mongodb.Db, quizScheduleId: string): Promise<QuizSchedule | undefined> {
        const dbQuizSchedule = new DBQuizSchedule(db).getCollection();

        let quizSchedule: IDB_QuizSchedule | null = await dbQuizSchedule.findOne(
            {
                _id: new mongodb.ObjectID(quizScheduleId),
            }
        );

        if (!quizSchedule) {
            return undefined;
        }

        quizScheduleId = quizSchedule._id!.toHexString();

        if (!quizSchedule.questionId) {
            throw new Error(`Question ID missing for quiz schedule "${quizScheduleId}"`);
        }

        const questionId = quizSchedule.questionId.toHexString();

        const question = await Question.GetAutoFetch(db, questionId);

        if (!question) {
            throw new Error(`Question "${questionId}" missing for quiz schedule "${quizScheduleId}"`)
        }

        return new QuizSchedule(db, quizSchedule, question);
    }

    public static async FetchActiveNow(db: mongodb.Db, course?: string): Promise<QuizSchedule | undefined> {
        const now = new Date();

        // Round off to the start of the minute
        now.setSeconds(0);
        now.setMilliseconds(0);

        const dbQuizSchedule = new DBQuizSchedule(db).getCollection();

        const filter: any = {
            availableStart: { $lte: now },  // Inclusive start time
            availableEnd: { $gt: now },     // Exclusive end time
        }

        // Add "course" filter if provided
        if (course) {
            filter["course"] = course;
        }

        // We only limit ourselves to one quiz at a time
        const quizSchedule: IDB_QuizSchedule = await dbQuizSchedule.findOne(filter);

        if (!quizSchedule) {
            return undefined;
        }

        const quizScheduleId = quizSchedule._id!.toHexString();

        // If quiz schedule has existing object, return that
        const existingObj = QuizSchedule.Get(quizScheduleId);

        if (existingObj) {
            return existingObj;
        }

        if (!quizSchedule.questionId) {
            throw new Error(`Question ID missing for quiz schedule "${quizScheduleId}"`);
        }

        const questionId = quizSchedule.questionId.toHexString();

        // Fetch related objects to quiz schedule
        const question = await Question.GetAutoFetch(db, questionId);

        if (!question) {
            throw new Error(`Question "${questionId}" missing for quiz schedule "${quizScheduleId}"`);
        }

        return new QuizSchedule(db, quizSchedule, question);
    }

    private static async Update(quizSchedule: QuizSchedule, updateData: IDB_QuizSchedule) {
        const dbQuizSchedule = new DBQuizSchedule(quizSchedule.getDb()).getCollection();

        const result = await dbQuizSchedule.findOneAndUpdate(
            {
                _id: quizSchedule.getOID(),
            },
            {
                $set: updateData,
            },
            {
                returnOriginal: false,
            }
        );

        // Update data for this object
        quizSchedule.data = result.value;
    }

    private constructor(db: mongodb.Db, data: IDB_QuizSchedule, question: Question) {
        this.data = data;
        this.question = question;
        this.db = db;

        this.addToStore();
    }

    private getDb() {
        return this.db;
    }

    public getOID() {
        return this.data._id!;
    }

    public getId() {
        return this.getOID().toHexString();
    }

    public getData() {
        return this.data;
    }

    public getQuestion() {
        return this.question;
    }

    public async setAvailableStart(date: Date) {
        await QuizSchedule.Update(this, {
            availableStart: date,
        });
    }

    public async setAvailableEnd(date: Date) {
        await QuizSchedule.Update(this, {
            availableEnd: date,
        });
    }

    private addToStore() {
        QuizSchedule.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        QuizSchedule.Store.delete(this.getId());
    }

    public destroyInstance() {
        this.removeFromStore();

        // Remove related objects
        QuizAttempt.GetWithQuizSchedule(this).forEach(_ => _.destroyInstance());
    }
}