import * as mongodb from "mongodb";
import { SurveyResponse as DBSurveyResponse, IDB_SurveyResponse } from "../data/models/SurveyResponse";

import { KVStore } from "../../../common/js/KVStore";

// Refers to...
import { Survey } from "./Survey";
import { QuizAttempt } from "../quiz/QuizAttempt";

export class SurveyResponse {
    private static readonly Store = new KVStore<SurveyResponse>();

    private data: IDB_SurveyResponse;
    private readonly survey: Survey;
    private readonly quizAttempt: QuizAttempt;

    private readonly db: mongodb.Db;

    public static Get(surveyResponseId: string) {
        return SurveyResponse.Store.get(surveyResponseId);
    }

    public static GetWithSurvey(survey: Survey) {
        return SurveyResponse.Store.getValues().filter(surveyResponse => surveyResponse.getSurvey() === survey);
    }

    public static GetWithQuizAttempt(quizAttempt: QuizAttempt) {
        return SurveyResponse.Store.getValues().filter(surveyResponse => surveyResponse.getQuizAttempt() === quizAttempt);
    }

    public static async GetAutoFetch(db: mongodb.Db, surveyResponseId: string) {
        const surveyResponse = SurveyResponse.Get(surveyResponseId);

        if (surveyResponse) {
            return surveyResponse;
        }

        return await SurveyResponse.Fetch(db, surveyResponseId);
    }

    public static async Create(db: mongodb.Db, data: IDB_SurveyResponse, survey: Survey, quizAttempt: QuizAttempt) {
        const dbSurveyResponse = new DBSurveyResponse(db).getCollection();

        data.surveyId = survey.getOID();
        data.quizAttemptId = quizAttempt.getOID();

        await dbSurveyResponse.insertOne(data);

        return new SurveyResponse(db, data, survey, quizAttempt);
    }

    public static async Fetch(db: mongodb.Db, surveyResponseId: string): Promise<SurveyResponse | undefined> {
        const dbSurveyResponse = new DBSurveyResponse(db).getCollection();

        let surveyResponse: IDB_SurveyResponse | null = await dbSurveyResponse.findOne(
            {
                _id: new mongodb.ObjectID(surveyResponseId),
            }
        );

        if (!surveyResponse) {
            return undefined;
        }

        const survey = await Survey.GetAutoFetch(db, surveyResponse.surveyId.toHexString());

        if (!survey) {
            throw new Error(`Survey "${surveyResponse.surveyId.toHexString()}" missing for survey response "${surveyResponse._id.toHexString()}"`)
        }

        const quizAttempt = await QuizAttempt.GetAutoFetch(db, surveyResponse.quizAttemptId.toHexString());

        if (!quizAttempt) {
            throw new Error(`Quiz attempt "${surveyResponse.quizAttemptId.toHexString()}" missing for survey response "${surveyResponse._id.toHexString()}"`)
        }

        return new SurveyResponse(db, surveyResponse, survey, quizAttempt);
    }

    private static async Update(surveyResponse: SurveyResponse, updateData: IDB_SurveyResponse) {
        const dbSurveyResponse = new DBSurveyResponse(surveyResponse.getDb()).getCollection();

        const result = await dbSurveyResponse.findOneAndUpdate(
            {
                _id: surveyResponse.getOID(),
            },
            {
                $set: updateData,
            },
            {
                returnOriginal: false,
            }
        );

        // Update data for this object
        surveyResponse.data = result.value;
    }

    private constructor(db: mongodb.Db, data: IDB_SurveyResponse, survey: Survey, quizAttempt: QuizAttempt) {
        this.data = data;
        this.survey = survey;
        this.quizAttempt = quizAttempt;
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

    public getSurvey() {
        return this.survey;
    }

    public getQuizAttempt() {
        return this.quizAttempt;
    }

    private addToStore() {
        SurveyResponse.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        SurveyResponse.Store.delete(this.getId());
    }

    public destroyInstance() {
        this.removeFromStore();
    }
}