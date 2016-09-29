import {WSEndpoint} from "../WSEndpoint";

import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import {PacSeqSocket_Server} from "../../../../common/js/PacSeqSocket_Server";

import * as mongodb from "mongodb";
import {Database} from "../../data/Database";
import {SurveyResponse} from "../../data/models/SurveyResponse";

import {MoocchatUserSession} from "../../user/MoocchatUserSession";

export class SurveyEndpoint extends WSEndpoint {
    private static HandleSubmitSurvey(socket: PacSeqSocket_Server, data: IWSToServerData.SurveyResponse, db: mongodb.Db) {
        const session = MoocchatUserSession.GetSession(data.sessionId, socket);

        if (!session) {
            return console.error("Attempted survey submission with invalid session ID = " + data.sessionId);
        }

        // If no survey or survey already saved, don't save another
        if (!session.data.survey || session.data.surveyTaken) {
            return;
        }

        session.data.surveyTaken = true;

        new SurveyResponse(db).insertOne({
            sessionId: new Database.ObjectId(session.getId()),
            surveyId: session.data.survey._id,
            timestamp: new Date(),
            content: data.content
        });
    }



    private db: mongodb.Db;

    constructor(socket: PacSeqSocket_Server, db: mongodb.Db) {
        super(socket);
        this.db = db;
    }

    public get onSubmitSurvey() {
        return (data: IWSToServerData.SurveyResponse) => {
            SurveyEndpoint.HandleSubmitSurvey(this.getSocket(), data, this.db);
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