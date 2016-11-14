import * as mongodb from "mongodb";
import { QuestionOptionCorrect as DBQuestionOptionCorrect, IDB_QuestionOptionCorrect } from "../data/models/QuestionOptionCorrect";

import { KVStore } from "../../../common/js/KVStore";

// Refers to...
import { Question } from "./Question";
import { QuestionOption } from "./QuestionOption";

export class QuestionOptionCorrect {
    private static readonly Store = new KVStore<QuestionOptionCorrect>();

    private data: IDB_QuestionOptionCorrect;
    private readonly question: Question;
    private readonly questionOption: QuestionOption;

    private readonly db: mongodb.Db;

    public static Get(questionId: string) {
        return QuestionOptionCorrect.Store.get(questionId);
    }

    public static GetWithQuestion(question: Question) {
        return QuestionOptionCorrect.Store.getValues().filter(questionOptionCorrect => questionOptionCorrect.getQuestion() === question);
    }

    public static GetWithQuestionOption(questionOption: QuestionOption) {
        return QuestionOptionCorrect.Store.getValues().filter(questionOptionCorrect => questionOptionCorrect.getQuestionOption() === questionOption);
    }

    public static async GetAutoFetch(db: mongodb.Db, questionId: string) {
        const question = QuestionOptionCorrect.Get(questionId);

        if (question) {
            return question;
        }

        return await QuestionOptionCorrect.Fetch(db, questionId);
    }

    public static async Create(db: mongodb.Db, data: IDB_QuestionOptionCorrect, question: Question, questionOption: QuestionOption) {
        const dbQuestionOptionCorrect = new DBQuestionOptionCorrect(db).getCollection();

        data.questionId = question.getOID();
        data.optionId = questionOption.getOID();

        await dbQuestionOptionCorrect.insertOne(data);

        return new QuestionOptionCorrect(db, data, question, questionOption);
    }

    public static async Fetch(db: mongodb.Db, questionOptionCorrectId: string): Promise<QuestionOptionCorrect | undefined> {
        const dbQuestionOptionCorrect = new DBQuestionOptionCorrect(db).getCollection();

        let questionOptionCorrect: IDB_QuestionOptionCorrect | null = await dbQuestionOptionCorrect.findOne(
            {
                _id: new mongodb.ObjectID(questionOptionCorrectId),
            }
        );

        if (!questionOptionCorrect) {
            return undefined;
        }

        questionOptionCorrectId = questionOptionCorrect._id!.toHexString();

        if (!questionOptionCorrect.questionId) {
            throw new Error(`Question ID missing for question option correct "${questionOptionCorrectId}"`)
        }

        const questionId = questionOptionCorrect.questionId.toHexString();

        const question = await Question.GetAutoFetch(db, questionId);

        if (!question) {
            throw new Error(`Question "${questionId}" missing for question option correct "${questionOptionCorrectId}"`)
        }

        if (!questionOptionCorrect.optionId){
            throw new Error(`Question option ID missing for question option correct "${questionOptionCorrectId}"`)
        }

        const optionId = questionOptionCorrect.optionId.toHexString();

        const questionOption = await QuestionOption.GetAutoFetch(db, optionId);

        if (!questionOption) {
            throw new Error(`Question option "${optionId}" missing for question option correct "${questionOptionCorrectId}"`)
        }

        return new QuestionOptionCorrect(db, questionOption, question, questionOption);
    }

    private static async Update(questionOptionCorrect: QuestionOptionCorrect, updateData: IDB_QuestionOptionCorrect) {
        const dbQuestionOptionCorrect = new DBQuestionOptionCorrect(questionOptionCorrect.getDb()).getCollection();

        const result = await dbQuestionOptionCorrect.findOneAndUpdate(
            {
                _id: questionOptionCorrect.getOID(),
            },
            {
                $set: updateData,
            },
            {
                returnOriginal: false,
            }
        );

        // Update data for this object
        questionOptionCorrect.data = result.value;
    }

    private constructor(db: mongodb.Db, data: IDB_QuestionOptionCorrect, question: Question, questionOption: QuestionOption) {
        this.data = data;
        this.question = question;
        this.questionOption = questionOption;
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

    public getQuestion() {
        return this.question;
    }

    public getQuestionOption() {
        return this.questionOption;
    }

    public async setJustification(justification: string) {
        await QuestionOptionCorrect.Update(this, {
            justification,
        });
    }

    private addToStore() {
        QuestionOptionCorrect.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        QuestionOptionCorrect.Store.delete(this.getId());
    }

    public destroyInstance() {
        this.removeFromStore();
    }
}