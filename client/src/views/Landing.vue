<template>
  <div class="landing">
    <h1>Quiz Sessions</h1>
    <ul class="quiz-list-items" v-if="!selectedQuizSession">
      <template v-for="pastSession in pastAttemptedQuizSessions">
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

      <template v-for="quizSession in quizSessions">
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

    <template v-if="selectedQuizSession && pastAttemptedQuizSessions.find((q) => q._id === selectedQuizSession._id)">
      <button @click="() => selectedQuizSession = null">&lt; Back</button>
      <Feedback :quizSession="selectedQuizSession" />
    </template>
    <div class="center margin-top">
      <button
        v-if="quiz && quizAvailable && !quizSession && quizSessionFetched"
        class="primary"
        tag="button"
        @click="startQuizSession()"
      >Start Session</button>
      <!-- TODO Style unavailable button -->
      <!-- Note button was used instead of router-link due to @click not being listened -->
      <button
        v-else-if="!quizSession"
        class="secondary"
      >The quiz is not available for Quiz {{quiz.title}}</button>
      <button v-else class="primary" tag="button">No Session Available</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.quiz-list-items {
  max-height: 50vh;
  overflow: scroll;
}

.landing {
  margin-bottom: 175px;
  padding: 1.5em;
  @media only screen and (max-width: 1483px) {
    padding: 1.5em;
  }

  .content-inner-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }

  li {
    svg {
      font-size: 13px;
      margin-right: 0.5em;
      vertical-align: baseline;

      &.base1 {
        color: $light-blue;
      }
      &.base2 {
        color: $green;
      }
      &.base3 {
        color: $yellow;
      }
      &.base4 {
        color: $red;
      }
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import {
  IUser,
  IQuiz,
  IQuizSession,
  IUserSession,
} from "../../../common/interfaces/ToClientData";
import OverviewContainer from "../components/OverviewContainer.vue";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../../common/interfaces/IWSToServerData";
import { SocketState, TimerSettings } from "../interfaces";
import { WebsocketManager } from "../../../common/js/WebsocketManager";
import { WebsocketEvents } from "../../../common/js/WebsocketEvents";
import { EventBus } from "../EventBus";
import { EmitterEvents } from "../emitters";
import QuizSessionListItem from "../components/QuizSessionListItem.vue";
import Feedback from "../components/Feedback.vue";
import { IQuizSchedule } from "../../../common/interfaces/DBSchema";

export type PastQuizSession = (IQuizSession & { quiz: Partial<IQuiz> } & {
    overallScore?: number;
    overallMaximumMarks?: number;
})

@Component({
  components: {
    OverviewContainer,
    QuizSessionListItem,
    Feedback
  },
})
export default class Landing extends Vue {
  selectedQuizSession: any | null = null;

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
    return quizSession.availableStart < Date.now();
  }

  pastSessionClickHandler(pastSession: any) {
    alert("hello");
  }

  quizSessionClickHandler(quizSession: any) {
    alert("Clicked session ...");
  }

  isSelectedQuizSessionAttempted() {

  }
  get pastAttemptedQuizSessions(): PastQuizSession[] {
    return [
      {
        _id: 'aspdlasdsad',
        quizId: "5f44b6c0261ab5499566b738",
        userSessionId: "5f44b6db261ab5499566b739----1",
        responses: ["5f44b6eb261ab5499566b73b"],
        startTime: 1598338780528,
        complete: true,
        quiz: {
          title: "TCL Session 1",
          course: "ENGG1234",
          pages: [],
          markingConfiguration: { maximumMarks: 5, allowMultipleMarkers: true },
        },
        overallScore: 12,
        overallMaximumMarks: 15,
      },
      {
        quizId: "5f44b6c0261ab5499566b738",
        userSessionId: "5f44b6db261ab5499566b739----2",
        responses: ["5f44b6eb261ab5499566b73b"],
        startTime: 1598338780528,
        complete: true,
        quiz: {
          title: "TCL Session 1",
          course: "ENGG1234",
          pages: [],
          markingConfiguration: { maximumMarks: 5, allowMultipleMarkers: true },
        },
        overallMaximumMarks: 15,
      },
    ];
  }

  get quizSessions(): Partial<IQuiz>[] {
    return [
      {
        _id: "abc123",
        availableStart: new Date(Date.now() - 10000),
        availableEnd: new Date(Date.now() + 1000000),
        title: "TCL Session 2",
        course: "ENGG1234",
      },
      {
        _id: "xyz2322",
        availableStart: new Date(Date.now() + Date.now()),
        availableEnd: new Date(Date.now() + Date.now() + 50000),
        title: "TCL Session 3",
        course: "ENGG1234",
      },
      {
        _id: "xyz23231",
        availableStart: new Date(Date.now() + Date.now()),
        availableEnd: new Date(Date.now() + Date.now() + 50000),
        title: "TCL Session 3",
        course: "ENGG1234",
      },
      {
        _id: "xyz231232",
        availableStart: new Date(Date.now() + Date.now()),
        availableEnd: new Date(Date.now() + Date.now() + 50000),
        title: "TCL Session 3",
        course: "ENGG1234",
      },
      {
        _id: "xyz212312332",
        availableStart: new Date(Date.now() + Date.now()),
        availableEnd: new Date(Date.now() + Date.now() + 50000),
        title: "TCL Session 3",
        course: "ENGG1234",
      },
      {
        _id: "xy123123z232",
        availableStart: new Date(Date.now() + Date.now()),
        availableEnd: new Date(Date.now() + Date.now() + 50000),
        title: "TCL Session 3",
        course: "ENGG1234",
      },
      {
        _id: "xyz231231232",
        availableStart: new Date(Date.now() + Date.now()),
        availableEnd: new Date(Date.now() + Date.now() + 50000),
        title: "TCL Session 3",
        course: "ENGG1234",
      },
    ];
  }

  isQuizSessionMarked(quizSession: any) {
    return quizSession.overallScore;
  }
  get user(): IUser | null {
    return this.$store.getters.user;
  }

  get quiz(): IQuiz | null {
    return this.$store.getters.quiz;
  }

  get quizSession(): IQuizSession | null {
    return this.$store.getters.quizSession;
  }

  get userSession(): IUserSession | null {
    return this.$store.getters.userSession;
  }

  get socketState(): SocketState {
    return this.$store.getters.socketState;
  }

  get socket(): WebsocketManager | null {
    return this.socketState && this.socketState.socket
      ? this.socketState.socket
      : null;
  }

  get quizAvailable(): boolean {
    return this.$store.getters.quizAvailable;
  }

  get quizSessionFetched(): boolean {
    return this.$store.getters.quizSessionFetched;
  }

  get resync(): boolean {
    return this.$store.getters.resync;
  }

  private scrollToTop(): void {
    window.scrollTo(0, 0);
  }

  private startQuizSession() {
    this.scrollToTop();

    if (!this.quiz || !this.userSession) {
      return;
    }

    const outgoingQuizSession: IQuizSession = {
      quizId: this.quiz!._id,
      userSessionId: this.userSession!._id,
      responses: [],
    };

    this.$store
      .dispatch("createQuizSession", outgoingQuizSession)
      .then(() => {
        this.socket!.emitData<IWSToServerData.StoreSession>(
          WebsocketEvents.OUTBOUND.STORE_QUIZ_SESSION_SOCKET,
          {
            quizSessionId: this.quizSession!._id!,
          }
        );
        EventBus.$emit(
          EmitterEvents.START_TIMER,
          this.$store.getters.currentTimerSettings
        );
        this.$router.push("/page");
      })
      .catch((e: Error) => {
        console.log(e);
      });
  }

  private mounted() {
    this.$store.dispatch("createSocket");
  }

  @Watch("resync")
  private waitForResync(newVal: number, oldVal?: number) {
    // Idea ito push to the page if it has changed also recompute the timer settings
    this.$router.push("/page");

    // New timer settings assuming it has been generated
    const tempSettings: TimerSettings | null = this.$store.getters
      .currentTimerSettings;
    if (tempSettings) {
      tempSettings.timeoutInMins = this.$store.getters.resyncAmount;
      EventBus.$emit(
        EmitterEvents.START_TIMER,
        this.$store.getters.currentTimerSettings
      );
    }
  }
}
</script>
