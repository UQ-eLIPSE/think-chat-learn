import {IAnswer} from "../../common/interfaces/IAnswer";

/**
 * MOOCchat
 * Answer container module
 * 
 * Holds answers provided by the user for a session.
 */
export class MoocchatAnswerContainer {
    public initial: IAnswer;
    public revised: IAnswer;

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