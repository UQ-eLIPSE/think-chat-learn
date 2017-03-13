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

        questionResponseId = questionResponse._id!.toHexString();

        if (!questionResponse.optionId) {
            throw new Error(`Option ID missing for question response "${questionResponseId}"`);
        }
        
        const optionId = questionResponse.optionId.toHexString();

        const questionOption = await QuestionOption.GetAutoFetch(db, optionId);

        if (!questionOption) {
            throw new Error(`Question option "${optionId}" missing for question option "${questionResponseId}"`)
        }

        return new QuestionResponse(db, questionResponse, questionOption);
    }

    // private static async Update(questionResponse: QuestionResponse, updateData: IDB_QuestionResponse) {
    //     const dbQuestionResponse = new DBQuestionResponse(questionResponse.getDb()).getCollection();

    //     const result = await dbQuestionResponse.findOneAndUpdate(
    //         {
    //             _id: questionResponse.getOID(),
    //         },
    //         {
    //             $set: updateData,
    //         },
    //         {
    //             returnOriginal: false,
    //         }
    //     );

    //     // Update data for this object
    //     questionResponse.data = result.value;
    // }

    private constructor(db: mongodb.Db, data: IDB_QuestionResponse, questionOption: QuestionOption) {
        this.data = data;
        this.questionOption = questionOption;
        this.db = db;

        this.addToStore();
    }

    // private getDb() {
    //     return this.db;
    // }

    public getOID() {
        return this.data._id!;
    }

    public getId() {
        return this.getOID().toHexString();
    }

    public getData() {
        // Don't leak answer `optionId` (which relates to confidence rating) publicly
        const { justification } = this.data;

        return { justification };
    }

    public getQuestionOption() {
        return this.questionOption;
    }

    public getJustification() {
        return this.data.justification;
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
        QuizAttempt.GetWithResponse(this).forEach(_ => _.destroyInstance());
    }
}
