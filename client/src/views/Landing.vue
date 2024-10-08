<template>
  <div class="landing">
    <div class="center margin-top">
      <!-- <button
        v-if="quiz && quizAvailable && !quizSession && quizSessionFetched"
        class="primary"
        tag="button"
        @click="startQuizSession()"
      >Start Session</button> -->
      <!-- TODO Style unavailable button -->
      <!-- Note button was used instead of router-link due to @click not being listened -->
      <button
        v-if="isSessionUnavailable"
        class="secondary"
      >The quiz is not available for Quiz {{quiz.title}}</button>
      <button v-else class="primary" tag="button">No Session Available</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>

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
  IUserSession
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
import API from "../../../common/js/DB_API";
import { getIdToken, setIdToken, getLoginResponse } from "../../../common/js/front_end_auth";

@Component({
  components: {
    OverviewContainer
  },
})
export default class Landing extends Vue {
  
  get canStartSession() {
    return !!(this.quiz && this.quizAvailable && !this.quizSession && this.quizSessionFetched);
  }

  get isSessionUnavailable() {
    return !this.quizSession;
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

  @Watch("canStartSession")
  private startSessionWatchHandler(newVal: boolean, oldVal?: boolean) {
    if(!oldVal && newVal) {
      this.startQuizSession();
    }
  }
}
</script>
