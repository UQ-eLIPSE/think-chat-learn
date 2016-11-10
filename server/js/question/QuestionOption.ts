import * as mongodb from "mongodb";
import { QuestionOption as DBQuestionOption, IDB_QuestionOption } from "../data/models/QuestionOption";

import { KVStore } from "../../../common/js/KVStore";

// Refers to...
import { Question } from "./Question";

// Referred to by...
import { QuestionOptionCorrect } from "./QuestionOptionCorrect";
import { QuestionResponse } from "./QuestionResponse";

export class QuestionOption {
    private static readonly Store = new KVStore<QuestionOption>();

    private data: IDB_QuestionOption;
    private readonly question: Question;

    private readonly db: mongodb.Db;

    public static Get(questionId: string) {
        return QuestionOption.Store.get(questionId);
    }

    public static GetWith(question: Question) {
        return QuestionOption.Store.getValues().filter(questionOption => questionOption.getQuestion() === question);
    }

    public static async GetAutoFetch(db: mongodb.Db, questionOptionId: string) {
        const questionOption = QuestionOption.Get(questionOptionId);

        if (questionOption) {
            return questionOption;
        }

        return await QuestionOption.Fetch(db, questionOptionId);
    }

    public static async Create(db: mongodb.Db, data: IDB_QuestionOption, question: Question) {
        const dbQuestionOption = new DBQuestionOption(db).getCollection();

        data.questionId = question.getOID();

        await dbQuestionOption.insertOne(data);

        return new QuestionOption(db, data, question);
    }

    public static async Fetch(db: mongodb.Db, questionOptionId: string): Promise<QuestionOption | undefined> {
        const dbQuestionOption = new DBQuestionOption(db).getCollection();

        let questionOption: IDB_QuestionOption | null = await dbQuestionOption.findOne(
            {
                _id: new mongodb.ObjectID(questionOptionId),
            }
        );

        if (!questionOption) {
            return undefined;
        }

        const question = await Question.GetAutoFetch(db, questionOption.questionId.toHexString());

        if (!question) {
            throw new Error(`Question "${questionOption.questionId.toHexString()}" missing for question option "${questionOption._id.toHexString()}"`)
        }

        return new QuestionOption(db, questionOption, question);
    }

    public static async FetchWithQuestion(db: mongodb.Db, question: Question) {
        const dbQuestionOption = new DBQuestionOption(db).getCollection();

        let questionOptions: IDB_QuestionOption[] = await dbQuestionOption.find(
            {
                questionId: question.getOID(),
            }
        ).toArray();

        return questionOptions.map(questionOption => {
            const existingObj = QuestionOption.Get(questionOption._id.toHexString());

            if (existingObj) {
                return existingObj;
            }

            return new QuestionOption(db, questionOption, question)
        });
    }

    private static async Update(questionOption: QuestionOption, updateData: IDB_QuestionOption) {
        const dbQuestionOption = new DBQuestionOption(questionOption.getDb()).getCollection();

        const result = await dbQuestionOption.findOneAndUpdate(
            {
                _id: questionOption.getOID(),
            },
            {
                $set: updateData,
            },
            {
                returnOriginal: false,
            }
        );

        // Update data for this object
        questionOption.data = result.value;
    }

    private constructor(db: mongodb.Db, data: IDB_QuestionOption, question: Question) {
        this.data = data;
        this.question = question;
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

    public getQuestion() {
        return this.question;
    }

    private addToStore() {
        QuestionOption.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        QuestionOption.Store.delete(this.getId());
    }

    public destroyInstance() {
        this.removeFromStore();

        // Remove related objects
        QuestionOptionCorrect.GetWithQuestionOption(this).forEach(_ => _.destroyInstance());
        QuestionResponse.GetWith(this).forEach(_ => _.destroyInstance());
    }
}