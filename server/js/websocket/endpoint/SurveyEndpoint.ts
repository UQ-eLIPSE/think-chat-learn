import { WSEndpoint } from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import { PacSeqSocket_Server } from "../../../../common/js/PacSeqSocket_Server";

import * as mongodb from "mongodb";

import { Survey } from "../../survey/Survey";
import { SurveyResponse } from "../../survey/SurveyResponse";
import { QuizAttempt } from "../../quiz/QuizAttempt";

// import {MoocchatUserSession} from "../../user/MoocchatUserSession";

export class SurveyEndpoint extends WSEndpoint {
    private static async HandleSubmitSurvey(socket: PacSeqSocket_Server, data: IWSToServerData.SurveyResponse, db: mongodb.Db) {
        const quizAttempt = await QuizAttempt.Get(data.quizAttemptId);

        if (!quizAttempt) {
            return console.error("Attempted survey submission with invalid quiz attempt ID = " + data.quizAttemptId);
        }

        const previousSurveyResponse = await SurveyResponse.GetWithQuizAttempt(quizAttempt);

        // If survey already saved, don't save another
        if (!previousSurveyResponse) {
            return;
        }

        const survey = await Survey.FetchActiveNow(db, quizAttempt.getQuizSchedule().getQuestion().getData().course);

        // If no survey, then don't save at all
        if (!survey) {
            return;
        }

        await SurveyResponse.Create(db, {
            timestamp: new Date(),
            content: data.content,
        }, survey, quizAttempt);

        // TODO: MOOCchat does not currently return survey success message; this should be included.
    }



    private db: mongodb.Db;

    constructor(socket: PacSeqSocket_Server, db: mongodb.Db) {
        super(socket);
        this.db = db;
    }

    public get onSubmitSurvey() {
        return (data: IWSToServerData.SurveyResponse) => {
            SurveyEndpoint.HandleSubmitSurvey(this.getSocket(), data, this.db)
                .catch(e => console.error(e));
        };
    }

    public returnEndpointEventHandler(name: string): (data: any) => void {
        switch (name) {
            case "submitSurvey": return this.onSubmitSurvey;
        }

        throw new Error(`No endpoint event handler for "${name}"`);
    }

    public registerAllEndpointSocketEvents() {
        WSEndpoint.RegisterSocketWithEndpointEventHandlers(this.getSocket(), this, [
            "submitSurvey",
        ]);
    }
}