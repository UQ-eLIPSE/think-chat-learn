import * as mongodb from "mongodb";
import { Survey as DBSurvey, IDB_Survey } from "../data/models/Survey";

import { KVStore } from "../../../common/js/KVStore";

// Referred to by...
import { SurveyResponse } from "./SurveyResponse";

export class Survey {
    private static readonly Store = new KVStore<Survey>();

    private data: IDB_Survey;

    private readonly db: mongodb.Db;

    public static Get(surveyId: string) {
        return Survey.Store.get(surveyId);
    }

    public static async GetAutoFetch(db: mongodb.Db, surveyId: string) {
        const survey = Survey.Get(surveyId);

        if (survey) {
            return survey;
        }

        return await Survey.Fetch(db, surveyId);
    }

    public static async Create(db: mongodb.Db, data: IDB_Survey) {
        const dbSurvey = new DBSurvey(db).getCollection();

        await dbSurvey.insertOne(data);

        return new Survey(db, data);
    }

    public static async Fetch(db: mongodb.Db, surveyId: string): Promise<Survey | undefined> {
        const dbSurvey = new DBSurvey(db).getCollection();

        let survey: IDB_Survey | null = await dbSurvey.findOne(
            {
                _id: new mongodb.ObjectID(surveyId),
            }
        );

        if (!survey) {
            return undefined;
        }

        return new Survey(db, survey);
    }

    public static async FetchActiveNow(db: mongodb.Db, course?: string): Promise<Survey | undefined> {
        const now = new Date();

        // Round off to the start of the minute
        now.setSeconds(0);
        now.setMilliseconds(0);

        const dbSurvey = new DBSurvey(db).getCollection();

        const filter: any = {
            availableStart: { $lte: now },  // Inclusive start time

            // Available end doesn't exist yet on Survey
            // availableEnd: { $gt: now },     // Exclusive end time
        }

        // Add "course" filter if provided
        if (course) {
            filter["course"] = course;
        }

        // We only limit ourselves to one survey at a time
        const survey: IDB_Survey = await dbSurvey.findOne(filter);

        if (!survey) {
            return undefined;
        }

        // If survey has existing object, return that
        const existingObj = Survey.Get(survey._id.toHexString());

        if (existingObj) {
            return existingObj;
        }

        return new Survey(db, survey);
    }

    private static async Update(survey: Survey, updateData: IDB_Survey) {
        const dbSurvey = new DBSurvey(survey.getDb()).getCollection();

        const result = await dbSurvey.findOneAndUpdate(
            {
                _id: survey.getOID(),
            },
            {
                $set: updateData,
            },
            {
                returnOriginal: false,
            }
        );

        // Update data for this object
        survey.data = result.value;
    }

    private constructor(db: mongodb.Db, data: IDB_Survey) {
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
        Survey.Store.put(this.getId(), this);
    }

    private removeFromStore() {
        Survey.Store.delete(this.getId());
    }

    public destroyInstance() {
        this.removeFromStore();

        // Remove related objects
        SurveyResponse.GetWithSurvey(this).forEach(_ => _.destroyInstance());
    }
}