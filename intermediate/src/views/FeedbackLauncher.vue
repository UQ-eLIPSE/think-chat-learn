<template>
  <div class="feedback-launcher">
    <h1 class="heading">
      <span class="icon-container">
        <font-awesome-icon icon="list" />
      </span> Quiz Sessions
    </h1>
    <ul class="quiz-list-items">
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
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import API from "../../../common/js/DB_API";

import QuizSessionListItem from "../components/QuizSessionListItem.vue";
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
  },
})
export default class FeedbackLauncher extends Vue {
  availableQuizzes: Partial<IQuiz>[] = [];
  upcomingQuizzes: Partial<IQuiz>[] = [];

  getSessionActionButtonProp(quizSession: any) {
    if (!quizSession) return undefined;
    const isActive = this.isQuizSessionActive(quizSession);
    return isActive
      ? {
          mode: "green",
          text: "LAUNCH",
        }
      : undefined;
  }

  isQuizSessionActive(quizSession: any) {
    if (!quizSession || !quizSession.availableStart) return false;
    return new Date(quizSession.availableStart) < new Date(Date.now());
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
      console.log("response loginResponse: ", response);
      if (response) {
        await this.$store.dispatch("setUser", response.user);
        await this.$store.dispatch(
          "setQuiz",
          quizScheduleData.quiz
            ? convertNetworkQuizIntoQuiz(quizScheduleData.quiz)
            : null
        );
        await this.$store.dispatch("setQuestions", quizScheduleData.questions);
        // Don't send the end time
        const session: IUserSession = {
          userId: response.user._id,
          course: response.courseId,
          startTime: Date.now(),
        };

        await this.$store.dispatch("createSession", session);
        this.$router.push("/");
      }
    } catch (e) {
      console.error("JWT sign error. Please contact administrator");
      return;
    }
  }

  isQuizSessionMarked(quizSession: any) {
    return quizSession.overallScore;
  }

  get quizzes(): Partial<IQuiz>[] {
    return this.availableQuizzes || [];
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
    await this.fetchActiveQuizzes();
    await this.fetchUpcomingQuizzes();
  }
}
</script>
<style scoped>
.feedback-launcher .heading {
  padding: 0.25rem;
}

.feedback-launcher .quiz-list-items {
  max-height: 57vh;
  overflow: scroll;
}

.feedback-launcher .back-button {
  min-width: 5rem;
  width: 5rem;
  font-size: 0.8em;
  height: 1.5rem;
  padding: 0 0.5rem;
}

.feedback-launcher .feedback {
  padding: 0.5rem;
}
</style>