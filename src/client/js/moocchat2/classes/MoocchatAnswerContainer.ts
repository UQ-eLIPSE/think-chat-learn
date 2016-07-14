interface IAnswer {
    optionId?: string;
    justification?: string;
}

/**
 * MOOCchat
 * Answer container module
 * 
 * Holds answers provided by the user for a session.
 */
export class MoocchatAnswerContainer {
    public initial: IAnswer = {};
    public revised: IAnswer = {};

    /**
     * Resets all answers to blank initial state.
     */
    public reset() {
        this.initial = {};
        this.revised = {};
    }
}