<template>
  <div class="feedback-launcher">
    <h1 class="heading">
      <span class="icon-container">
        <font-awesome-icon icon="list" />
      </span> Quiz Sessions
    </h1>
    <ul class="quiz-list-items" v-if="!selectedQuizSession">
      <template v-for="(pastSession, i) in pastAttemptedQuizSessions">
        <span :key="i">{{ pastSession._id }}</span>
        <QuizSessionListItem
          :heading="pastSession.quiz.title"
          :subheadings="[`${new Date(pastSession.startTime)}`]"
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
          :subheadings="[`Starts: ${new Date(quizSession.availableStart)}`, `Ends: ${new Date(quizSession.availableEnd)}`]"
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
      v-if="selectedQuizSession && pastAttemptedQuizSessions.find((q) => q._id === selectedQuizSession._id)"
    >
      <div>
        <button class="primary back-button" @click="() => selectedQuizSession = null">&lt; Back</button>
      </div>
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
    };
  }

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

  pastSessionClickHandler(pastSession: any) {
    alert("hello");
  }

  quizSessionClickHandler(quizSession: any) {
    alert("Clicked session ...");
  }

  // isSelectedQuizSessionAttempted() {}
  get pastAttemptedQuizSessions(): PastQuizSession[] {
    return this.pastQuizSessions;
    // return [
    // {
    //   _id: "aspdlasdsad",
    //   quizId: "5f44b6c0261ab5499566b738",
    //   userSessionId: "5f44b6db261ab5499566b739----1",
    //   responses: ["5f44b6eb261ab5499566b73b"],
    //   startTime: 1598338780528,
    //   complete: true,
    //   quiz: {
    //     title: "TCL Session 1",
    //     course: "ENGG1234",
    //     pages: [],
    //     markingConfiguration: { maximumMarks: 5, allowMultipleMarkers: true },
    //   },
    //   overallScore: 12,
    //   overallMaximumMarks: 15,
    // },
    // {
    //   quizId: "5f44b6c0261ab5499566b738",
    //   userSessionId: "5f44b6db261ab5499566b739----2",
    //   responses: ["5f44b6eb261ab5499566b73b"],
    //   startTime: 1598338780528,
    //   complete: true,
    //   quiz: {
    //     title: "TCL Session 1",
    //     course: "ENGG1234",
    //     pages: [],
    //     markingConfiguration: { maximumMarks: 5, allowMultipleMarkers: true },
    //   },
    //   overallMaximumMarks: 15,
    // },
    //   {
    //     _id: "5f4603d4c47d51831e7cac09",
    //     quizId: "5f44b6c0261ab5499566b738",
    //     userSessionId: "5f4603d3c47d51831e7cac08",
    //     responses: ["5f4603e4c47d51831e7cac0a"],
    //     startTime: 1598424020972,
    //     complete: true,
    //     quiz: {
    //       _id: "5f44b6c0261ab5499566b738",
    //       availableEnd: new Date("2020-08-29T04:10:00.000Z"),
    //       availableStart: new Date("2020-08-06T04:09:00.000Z"),
    //       title: "Test",
    //       course: "ENGG1234",
    //       pages: [
    //         {
    //           title: "Test",
    //           content: "<p>Test</p>",
    //           type: "QUESTION_ANSWER_PAGE" as any,
    //           questionId: "5f44b685261ab5499566b734",
    //           timeoutInMins: 0.25,
    //           _id: "5f44b6c0261ab5499566b736",
    //         },
    //         {
    //           title: "Discussion",
    //           content: "",
    //           type: "DISCUSSION_PAGE" as any,
    //           questionId: "5f44b685261ab5499566b734",
    //           timeoutInMins: 1,
    //           displayResponses: true,
    //           _id: "5f44b6c0261ab5499566b737",
    //         },
    //       ],
    //       markingConfiguration: { allowMultipleMarkers: true, maximumMarks: 5 },
    //       groupSize: 3,
    //       rubricId: "5f44b68d261ab5499566b735",
    //     },
    //     overallScore: 2,
    //     overallMaximumMarks: 15,
    //   },
    // ];
  }

  isQuizSessionMarked(quizSession: any) {
    return quizSession.overallScore;
  }

  get quizzes(): Partial<IQuiz>[] {
    return this.availableQuizzes || [];
    // return [
    //   {
    //     _id: "abc123",
    //     availableStart: new Date(Date.now() - 10000),
    //     availableEnd: new Date(Date.now() + 1000000),
    //     title: "TCL Session 2",
    //     course: "ENGG1234",
    //   },
    //   {
    //     _id: "xyz2322",
    //     availableStart: new Date(Date.now() + Date.now()),
    //     availableEnd: new Date(Date.now() + Date.now() + 50000),
    //     title: "TCL Session 3",
    //     course: "ENGG1234",
    //   },
    //   {
    //     _id: "xyz23231",
    //     availableStart: new Date(Date.now() + Date.now()),
    //     availableEnd: new Date(Date.now() + Date.now() + 50000),
    //     title: "TCL Session 3",
    //     course: "ENGG1234",
    //   },
    //   {
    //     _id: "xyz231232",
    //     availableStart: new Date(Date.now() + Date.now()),
    //     availableEnd: new Date(Date.now() + Date.now() + 50000),
    //     title: "TCL Session 3",
    //     course: "ENGG1234",
    //   },
    //   {
    //     _id: "xyz212312332",
    //     availableStart: new Date(Date.now() + Date.now()),
    //     availableEnd: new Date(Date.now() + Date.now() + 50000),
    //     title: "TCL Session 3",
    //     course: "ENGG1234",
    //   },
    //   {
    //     _id: "xy123123z232",
    //     availableStart: new Date(Date.now() + Date.now()),
    //     availableEnd: new Date(Date.now() + Date.now() + 50000),
    //     title: "TCL Session 3",
    //     course: "ENGG1234",
    //   },
    //   {
    //     _id: "xyz231231232",
    //     availableStart: new Date(Date.now() + Date.now()),
    //     availableEnd: new Date(Date.now() + Date.now() + 50000),
    //     title: "TCL Session 3",
    //     course: "ENGG1234",
    //   },
    // ];
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
    console.log("Past: ", attemptedResponse);
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
    console.log("Active: ", this.availableQuizzes);
  }

  private async mounted() {
    await this.fetchPastSessions();
    await this.fetchActiveQuizzes();

    // const q = this.$route.query.q;
    // // Essentially redirects to the main page assuming login is correct
    // setIdToken(q as string);
    // const response = getLoginResponse() as LoginResponse | IntermediateLogin;
    // await this.$store.dispatch("storeSessionToken", q);
    // const loginResponse = decodeToken(q as string) as LoginResponse;
    // console.log("Decode Login View token: ", decodeToken(q as string));
    // const attemptedResponse = await API.request(
    //   API.GET,
    //   API.QUIZSESSION + "history",
    //   {},
    //   undefined,
    //   q as string
    // );
    // console.log("Past: ", attemptedResponse);
    // const activeQuizzes = API.request(
    //   API.GET,
    //   API.QUIZ + "active",
    //   {},
    //   undefined,
    //   q as string
    // );
    // console.log("Active: ", activeQuizzes);
    // // If we have a response, fetch more data due to NGINX limitations
    // const quizScheduleData: QuizScheduleData = decodeToken(
    //   await this.$store.dispatch("handleToken")
    // );
    // // If we have a response , set the appropriate data and so on
    // if (response) {
    //   await this.$store.dispatch("setUser", response.user);
    //   await this.$store.dispatch(
    //     "setQuiz",
    //     quizScheduleData.quiz
    //       ? convertNetworkQuizIntoQuiz(quizScheduleData.quiz)
    //       : null
    //   );
    //   await this.$store.dispatch("setQuestions", quizScheduleData.questions);
    //   await this.$store.dispatch("setAvailability", response.available);
    //   // Don't send the end time
    //   const session: IUserSession = {
    //     userId: response.user._id,
    //     course: response.courseId,
    //     startTime: Date.now(),
    //   };
    //   await this.$store.dispatch("createSession", session);
    //   if (response.type === LoginResponseTypes.INTERMEDIATE_LOGIN) {
    //     await this.$store.dispatch(
    //       "retrieveQuizSession",
    //       response.quizSessionId
    //     );
    //   }
    //   this.$router.push("/");
    // }
  }
}
</script>
<style lang="scss" scoped>
.feedback-launcher {
  .heading {
    padding: 0.25rem;
  }

  .quiz-list-items {
    max-height: 50vh;
    overflow: scroll;
  }

  .back-button {
    min-width: 5rem;
    width: 5rem;
    font-size: 0.8em;
    height: 1.5rem;
    padding: 0 0.5rem;
  }

  .feedback {
    padding: 0.5rem;
  }
}
</style>