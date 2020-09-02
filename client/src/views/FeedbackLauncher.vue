<template>
  <div class="feedback-launcher">
    <h1 class="feedback-launcher-heading">
      <div v-if="isPastQuizSessionSelected" title="Back to quiz sessions" @click="() => selectedQuizSession = null" class="back-button-container icon-container">
          <font-awesome-icon icon="arrow-left" />
      </div>
      <span class="icon-container">
        <font-awesome-icon :icon="pageIcon" />
      </span> {{ pageTitle }}
    </h1>
    <ul class="quiz-list-items" v-if="!selectedQuizSession">
      <template v-for="pastSession in pastAttemptedQuizSessions">
        <QuizSessionListItem
          :heading="pastSession.quiz.title"
          :subheadings="[`${new Date(pastSession.startTime).toLocaleString()}`]"
          :clickable="true"
          :actionButton="getPastSessionActionButtonProp(pastSession)"
          @click="setSelectedQuizSession(pastSession)"
          @actionClick="setSelectedQuizSession(pastSession)"
          :key="pastSession.userSessionId"
        ></QuizSessionListItem>
      </template>
      <template v-for="quizSession in quizzes">
        <QuizSessionListItem
          :heading="quizSession.title"
          :subheadings="[`Starts: ${new Date(quizSession.availableStart).toLocaleString()}`, `Ends: ${new Date(quizSession.availableEnd).toLocaleString()}`]"
          :clickable="false"
          :actionButton="getSessionActionButtonProp(quizSession)"
          @click="() => {}"
          @actionClick="launchActiveQuiz(quizSession._id)"
          @actionClick2="setSelectedQuizSession(quizSession)"
          :disabled="!isQuizSessionActive(quizSession)"
          :key="quizSession._id"
        ></QuizSessionListItem>
      </template>
      <template v-for="quizSession in upcomingQuizzes">
        <QuizSessionListItem
          :heading="quizSession.title"
          :subheadings="[`Starts: ${new Date(quizSession.availableStart).toLocaleString()}`, `Ends: ${new Date(quizSession.availableEnd).toLocaleString()}`]"
          :clickable="false"
          :actionButton="getSessionActionButtonProp(quizSession)"
          @click="() => {}"
          @actionClick="setSelectedQuizSession(quizSession)"
          :disabled="!isQuizSessionActive(quizSession)"
          :key="quizSession._id"
        ></QuizSessionListItem>
      </template>
    </ul>

    <template
      v-if="isPastQuizSessionSelected"
    >
      <Feedback class="feedback" :quizSession="selectedQuizSession" />
    </template>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import API from "../../../common/js/DB_API";

import QuizSessionListItem from "../components/QuizSessionListItem.vue";
import Feedback from "../components/Feedback.vue";
import {
  IQuizSchedule,
  IQuizSession,
  IQuiz,
  IUserSession,
} from "../../../common/interfaces/DBSchema";
import {
  setIdToken,
  decodeToken,
  getLoginResponse,
  getIdToken,
} from "../../../common/js/front_end_auth";
import {
  LoginResponse,
  IntermediateLogin,
  QuizScheduleData,
  LoginResponseTypes,
} from "../../../common/interfaces/ToClientData";
import { convertNetworkQuizIntoQuiz } from "../../../common/js/NetworkDataUtils";

export type PastQuizSession = IQuizSession & { quiz: Partial<IQuiz> } & {
  overallScore?: number;
  overallMaximumMarks?: number;
};

@Component({
  components: {
    QuizSessionListItem,
    Feedback,
  },
})
export default class FeedbackLauncher extends Vue {
  selectedQuizSession: any | null = null;
  pastQuizSessions: PastQuizSession[] = [];
  availableQuizzes: Partial<IQuiz>[] = [];
  upcomingQuizzes: Partial<IQuiz>[] = [];

  get isPastQuizSessionSelected() {
    return this.selectedQuizSession && this.pastAttemptedQuizSessions.find((q) => q._id === this.selectedQuizSession._id);
  }

  get pageTitle() {
    return this.selectedQuizSession &&
      this.selectedQuizSession.quiz ? "Grades and Feedback" : "Quiz Sessions";
  }

  get pageIcon() {
    return this.selectedQuizSession &&
      this.selectedQuizSession.quiz ? "comments" : "list";
  }
  setSelectedQuizSession(quizSession: any) {
    this.selectedQuizSession = quizSession;
  }

  getPastSessionActionButtonProp(pastSession: PastQuizSession) {
    if (!pastSession) return undefined;
    return {
      mode: "text",
      text: pastSession.overallScore
        ? `${pastSession.overallScore}/${pastSession.overallMaximumMarks}`
        : "MARKING",
      icon: ""
    };
  }

  getSessionActionButtonProp(quizSession: any) {
    if (!quizSession) return undefined;
    const isActive = this.isQuizSessionActive(quizSession);
    return isActive
      ? {
          mode: "green",
          text: "LAUNCH",
          icon: ""
        }
      : undefined;
  }

  isQuizSessionActive(quizSession: any) {
    if (!quizSession || !quizSession.availableStart) return false;
    return new Date(quizSession.availableStart) < new Date(Date.now());
  }

  pastSessionClickHandler(pastSession: any) {
    alert("hello");
  }

  quizSessionClickHandler(quizSession: any) {
    alert("Clicked session ...");
  }




  async launchActiveQuiz(quizId: string) {
    // Launch quiz
    try {
      const tokenResponse = await API.request(
        API.POST,
        API.USER + "/launch-quiz",
        { quizId: quizId },
        undefined,
        getIdToken()
      );
      if (!tokenResponse || !tokenResponse.payload) {
        return console.error("JWT sign error. Please contact administrator");
      }

      setIdToken(tokenResponse.payload);

      const response = getLoginResponse() as LoginResponse | IntermediateLogin;

      await this.$store.dispatch("storeSessionToken", tokenResponse.payload);

      // const loginResponse = decodeToken(tokenResponse.payload as string) as LoginResponse;

      const quizScheduleData: QuizScheduleData = decodeToken(
        await this.$store.dispatch("handleToken")
      );

      // If we have a response , set the appropriate data and so on
      if (response) {
        await this.$store.dispatch("setUser", response.user);
        await this.$store.dispatch("setUserCourseTitle", response.courseTitle);
        await this.$store.dispatch(
          "setQuiz",
          quizScheduleData.quiz
            ? convertNetworkQuizIntoQuiz(quizScheduleData.quiz)
            : null
        );
        await this.$store.dispatch("setQuestions", quizScheduleData.questions);
        await this.$store.dispatch("setAvailability", response.available);
        // Don't send the end time
        const session: IUserSession = {
          userId: response.user._id,
          course: response.courseId,
          startTime: Date.now(),
        };
        await this.$store.dispatch("createSession", session);

        if (response.type === LoginResponseTypes.INTERMEDIATE_LOGIN) {
          await this.$store.dispatch(
            "retrieveQuizSession",
            response.quizSessionId
          );
        }
        
        this.$router.push("/");
      } else throw new Error('JWT error');
    } catch (e) {
      console.error("JWT sign error. Please contact administrator");
      return;
    }
  }
  // isSelectedQuizSessionAttempted() {}
  get pastAttemptedQuizSessions(): PastQuizSession[] {
    return this.pastQuizSessions;
  }

  isQuizSessionMarked(quizSession: any) {
    return quizSession.overallScore;
  }

  get quizzes(): Partial<IQuiz>[] {
    return this.availableQuizzes || [];
  }

  async fetchPastSessions() {
    const q = getIdToken();

    const attemptedResponse = await API.request(
      API.GET,
      API.QUIZSESSION + "history",
      {},
      undefined,
      q as string
    );
    // this.pastQuizSessions = (attemptedResponse && attemptedResponse.payload) || [];
    this.$set(
      this,
      "pastQuizSessions",
      (attemptedResponse && attemptedResponse.payload) || []
    );
  }

  async fetchActiveQuizzes() {
    const q = getIdToken();

    const activeQuizzes = await API.request(
      API.GET,
      API.QUIZ + "active",
      {},
      undefined,
      q as string
    );
    // this.availableQuizzes = (activeQuizzes && activeQuizzes.payload) || [];
    this.$set(
      this,
      "availableQuizzes",
      (activeQuizzes && activeQuizzes.payload) || []
    );
  }

  async fetchUpcomingQuizzes() {
    const q = getIdToken();

    const activeQuizzes = await API.request(
      API.GET,
      API.QUIZ + "upcoming",
      {},
      undefined,
      q as string
    );
    // this.availableQuizzes = (activeQuizzes && activeQuizzes.payload) || [];
    this.$set(
      this,
      "upcomingQuizzes",
      (activeQuizzes && activeQuizzes.payload) || []
    );
  }

  private async mounted() {

    // Check if quiz has already been selected in the backup queue panel
    {
        const token = getIdToken();
        
        if(token) {
          const decodedToken = decodeToken(token);

          if(decodedToken.type === LoginResponseTypes.INTERMEDIATE_LOGIN) {
            this.launchActiveQuiz(decodedToken.quizId);
          }
        }

    }

    
    await this.fetchPastSessions();
    await this.fetchActiveQuizzes();
    await this.fetchUpcomingQuizzes();
  }
}
</script>
<style lang="scss" scoped>
.feedback-launcher {
  .feedback-launcher-heading {
    display: flex;
    padding: 1rem 0.25rem;
    background: rgba(1, 0, 0, 0.02);
    border-radius: 5px;
    margin-bottom: 0em;
    box-shadow: 0 4px 6px -6px rgba(0, 0, 0, 0.15);
    > * {
      padding: 0 0.2rem;
    }

  }

  .quiz-list-items {
    max-height: 57vh;
    overflow: scroll;
  }

  .back-button {
    min-width: 5rem;
    width: 5rem;
    font-size: 0.8em;
    height: 1.5rem;
    padding: 0 0.5rem;
  }

  .back-button-container {
    cursor: pointer;
    padding-right: 0.8rem;

    &:hover {
      background: rgba(1, 0, 0, 0.05);
    }
  }

  .feedback {
    padding: 1rem;
  }

}
</style>