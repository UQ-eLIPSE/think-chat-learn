import {IDB_Question} from "./database/Question";
import {IDB_QuestionOption} from "./database/QuestionOption";
import {IDB_QuestionResponse} from "./database/QuestionResponse";
import {IDB_QuizSchedule} from "./database/QuizSchedule";
import {IDB_Survey} from "./database/Survey";

export class MoocchatUserSessionData {
    // These hold data from DB for a user session
    public quizSchedule: IDB_QuizSchedule;
    public quizQuestion: IDB_Question;
    public quizQuestionOptions: IDB_QuestionOption[];

    public survey: IDB_Survey;

    public username: string;

    // `responseInitial` and `responseFinal` hold the answers as received from client
    public response: { initial: IDB_QuestionResponse, final: IDB_QuestionResponse } = {
        initial: {},
        final: {}
    };

    constructor(
        quizSchedule: IDB_QuizSchedule,
        quizQuestion: IDB_Question,
        quizQuestionOptions: IDB_QuestionOption[],
        survey: IDB_Survey,
        username: string) {
            
        this.quizSchedule = quizSchedule;
        this.quizQuestion = quizQuestion;
        this.quizQuestionOptions = quizQuestionOptions;

        this.survey = survey;

        this.username = username;
    }
}