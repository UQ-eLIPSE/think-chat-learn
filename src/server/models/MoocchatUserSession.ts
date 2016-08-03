import {MoocchatUserSessionData} from "./MoocchatUserSessionData";
import {MoocchatUserSessionStore} from "./MoocchatUserSessionStore";

import {IDB_Question} from "./database/Question";
import {IDB_QuestionOption} from "./database/QuestionOption";
import {IDB_QuizSchedule} from "./database/QuizSchedule";
import {IDB_Survey} from "./database/Survey";

export class MoocchatUserSession {
    private static UserSessionStore: MoocchatUserSessionStore = new MoocchatUserSessionStore();

    private _userId: string;
    private _sessionId: string;
    private _userSessionData: MoocchatUserSessionData;




    public static GetSessionIds() {
        return MoocchatUserSession.UserSessionStore.getSessionIds();
    }

    public static GetSession(sessionId: string) {
        return MoocchatUserSession.UserSessionStore.getSession(sessionId);
    }

    public static Destroy(session: MoocchatUserSession) {
        const userId = session.getUserId();
        const sessionId = session.getId();

        session._userSessionData = undefined;
        session.setId(undefined);
        session.setUserId(undefined);

        MoocchatUserSession.UserSessionStore.remove(session);

        console.log(`Session destroyed; User = ${userId}, Session = ${sessionId}`);
    }



    constructor(userId: string, sessionId: string) {
        this.setUserId(userId);
        this.setId(sessionId);
        this.addToStore();

        console.log(`Session created; User = ${this.getUserId()}, Session = ${this.getId()}`);
    }

    public get data() {
        return this._userSessionData;
    }

    /**
     * Must be run prior to using this.data
     */
    public initSessionData(
        quizSchedule: IDB_QuizSchedule,
        quizQuestion: IDB_Question,
        quizQuestionOptions: IDB_QuestionOption[],
        survey: IDB_Survey) {

        this._userSessionData = new MoocchatUserSessionData(
            quizSchedule,
            quizQuestion,
            quizQuestionOptions,
            survey
        );
    }

    private setUserId(userId: string) {
        this._userId = userId;
    }

    public getUserId() {
        return this._userId;
    }

    private setId(sessionId: string) {
        this._sessionId = sessionId;
    }

    public getId() {
        return this._sessionId;
    }




    private addToStore() {
        MoocchatUserSession.UserSessionStore.add(this);
    }

    private removeFromStore() {
        MoocchatUserSession.UserSessionStore.remove(this);
    }
}