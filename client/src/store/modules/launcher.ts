import { AttemptedQuizSessionData, IQuizSchedule, IQuiz } from '../../../../common/interfaces/DBSchema';

export interface IState {
    pastQuizSessions: AttemptedQuizSessionData[] | null;
    activeQuizSessions: IQuiz[];
    // upcomingQuizSessions: 
    // // The difference between the two indices is that the currentIndex is what should be
    // // rendered and max is what pages can be rendered
    // currentIndex: number;
    // maxIndex: number;
  }