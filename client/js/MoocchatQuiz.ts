import * as ToClientData from "../../common/interfaces/ToClientData";

/**
 * MOOCchat
 * Quiz class module
 * 
 * Wraps around the quiz data that is returned from the server
 */
export class MoocchatQuiz {
    private data: ToClientData.Quiz;

    /**
     * @param {ToClientData.Quiz} data The quiz data returned from the server when first logging in
     */
    constructor(data: ToClientData.Quiz) {
        this.data = data;
    }

    public get questionId() {
        return this.data.question._id;
    }
    
    public get questionContent() {
        return this.data.question.content;
    }
    
    public get questionOptions() {
        // Sort choices by sequence number
        return this.data.questionOptions.sort((a, b) => {
            if (a.sequence === b.sequence) {
                return 0;
            }
            
            return (a.sequence < b.sequence) ? -1 : 1;
        });
    }

    public get questionInChatTextBlock() {
        return this.data.question.inChatTextBlock;
    }
}
