import * as mongodb from "mongodb";
import { QuestionResponse as DBQuestionResponse, IDB_QuestionResponse } from "../data/models/QuestionResponse";

import { KVStore } from "../../../common/js/KVStore";

// Refers to...
import { QuestionOption } from "./QuestionOption";

// Referred to by...
import { QuizAttempt } from "../quiz/QuizAttempt";

export class QuestionResponse {
    private static readonly Store = new KVStore<QuestionResponse>();

    private data: IDB_QuestionResponse;
    private readonly questionOption: QuestionOption;

    private readonly db: mongodb.Db;

    public static Get(questionResponseId: string) {
        return QuestionResponse.Store.get(questionResponseId);
    }

    public static GetWith(questionOption: QuestionOption) {
        return QuestionResponse.Store.getValues().filter(questionResponse => questionResponse.getQuestionOption() === questionOption);
    }

    public static async GetAutoFetch(db: mongodb.Db, questionResponseId: string) {
        const questionResponse = QuestionResponse.Get(questionResponseId);

        if (questionResponse) {
            return questionResponse;
        }

        return await QuestionResponse.Fetch(db, questionResponseId);
    }

    public static async Create(db: mongodb.Db, data: IDB_QuestionResponse, questionOption: QuestionOption) {
        const dbQuestionResponse = new DBQuestionResponse(db).getCollection();

        data.optionId = questionOption.getOID();

        await dbQuestionResponse.insertOne(data);

        return new QuestionResponse(db, data, questionOption);
    }

    public static async Fetch(db: mongodb.Db, questionResponseId: string): Promise<QuestionResponse | undefined> {
        const dbQuestionResponse = new DBQuestionResponse(db).getCollection();

        let questionResponse: IDB_QuestionResponse | null = await dbQuestionResponse.findOne(
            {
                _id: new mongodb.ObjectID(questionResponseId),
            }
        );

        if (!questionResponse) {
            return undefined;
        }

        const questionOption = await QuestionOption.GetAutoFetch(db, questionResponse.optionId.toHexString());

        if (!questionOption) {
            throw new Error(`Question option "${questionResponse.optionId.toHexString()}" missing for question option "${questionResponse._id.toHexString()}"`)
        }

        return new QuestionResponse(db, questionResponse, questionOption);
    }

    private static async Update(questionResponse: QuestionResponse, updateData: IDB_QuestionResponse) {
        const dbQuestionResponse = new DBQuestionResponse(questionResponse.getDb()).getCollection();

        const result = await dbQuestionResponse.findOneAndUpdate(
            {
                _id: questionResponse.getOID(),
            },
            {
                $set: updateData,
            },
            {
                returnOriginal: false,
            }
        );

        // Update data for this object
        questionResponse.data = result.value;
    }

    private constructor(db: mongodb.Db, data: IDB_QuestionResponse, questionOption: QuestionOption) {
        this.data = data;
        this.questionOption = questionOption;
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

    public getQuestionOption() {
        return this.questionOption;
    }

    private addToStore() {
        QuestionResponse.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        QuestionResponse.Store.delete(this.getId());
    }

    public destroyInstance() {
        this.removeFromStore();

        // Remove related objects
        QuizAttempt.GetWithResponseInitial(this).forEach(_ => _.destroyInstance());
        QuizAttempt.GetWithResponseFinal(this).forEach(_ => _.destroyInstance());
    }
}