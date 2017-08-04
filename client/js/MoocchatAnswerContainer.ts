import * as ToServerData from "../../common/interfaces/ToServerData";

/**
 * MOOCchat
 * Answer container module
 * 
 * Holds answers provided by the user for a session.
 */
export class MoocchatAnswerContainer {
    public initial: ToServerData.QuestionResponse;
    public revised: ToServerData.QuestionResponse;

    constructor() {
        this.reset();
    }

    /**
     * Resets all answers to blank initial state.
     */
    public reset() {
        this.initial = {};
        this.revised = {};
    }
}