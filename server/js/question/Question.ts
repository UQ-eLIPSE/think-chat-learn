import * as mongodb from "mongodb";
import { Question as DBQuestion, IDB_Question } from "../data/models/Question";

import { KVStore } from "../../../common/js/KVStore";

// Referred to by...
import { QuizSchedule } from "../quiz/QuizSchedule";
import { QuestionOption } from "./QuestionOption";
import { QuestionOptionCorrect } from "./QuestionOptionCorrect";
// import { QuestionAdvice } from "./QuestionAdvice";

export class Question {
    private static readonly Store = new KVStore<Question>();

    private data: IDB_Question;

    private readonly db: mongodb.Db;

    public static Get(questionId: string) {
        return Question.Store.get(questionId);
    }

    public static async GetAutoFetch(db: mongodb.Db, questionId: string) {
        const question = Question.Get(questionId);

        if (question) {
            return question;
        }

        return await Question.Fetch(db, questionId);
    }

    public static async Create(db: mongodb.Db, data: IDB_Question) {
        const dbQuestion = new DBQuestion(db).getCollection();

        await dbQuestion.insertOne(data);

        return new Question(db, data);
    }

    public static async Fetch(db: mongodb.Db, questionId: string): Promise<Question | undefined> {
        const dbQuestion = new DBQuestion(db).getCollection();

        let question: IDB_Question | null = await dbQuestion.findOne(
            {
                _id: new mongodb.ObjectID(questionId),
            }
        );

        if (!question) {
            return undefined;
        }

        return new Question(db, question);
    }

    private static async Update(question: Question, updateData: IDB_Question) {
        const dbQuestion = new DBQuestion(question.getDb()).getCollection();

        const result = await dbQuestion.findOneAndUpdate(
            {
                _id: question.getOID(),
            },
            {
                $set: updateData,
            },
            {
                returnOriginal: false,
            }
        );

        // Update data for this object
        question.data = result.value;
    }

    private constructor(db: mongodb.Db, data: IDB_Question) {
        this.data = data;
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

    public getData() {
        return this.data;
    }

    private addToStore() {
        Question.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        Question.Store.delete(this.getId());
    }

    public destroyInstance() {
        this.removeFromStore();

        // Remove related objects
        QuizSchedule.GetWith(this).forEach(_ => _.destroyInstance());
        QuestionOption.GetWith(this).forEach(_ => _.destroyInstance());
        QuestionOptionCorrect.GetWithQuestion(this).forEach(_ =>_.destroyInstance());
        // QuestionAdvice.GetWith(this).forEach(_ => _.destroyInstance());
    }
}