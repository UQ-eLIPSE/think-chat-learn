export interface FrontEndQuiz {
    id: string;
    questions: FrontEndQuestion[];
    startTime: Date;
    endTime: Date;
}

export interface FrontEndQuestion {
    id: string;
    title: string;
    content: string;
    course: string;
    options: FrontEndQuestionOption[];
}

export interface FrontEndQuestionOption {
    id: string;
    sequence: number;
    content: string;
}
