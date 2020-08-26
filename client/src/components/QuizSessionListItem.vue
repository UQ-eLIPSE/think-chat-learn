<template>
  <div class="quiz-session-list-item" :class="quizItemClasses" @click="clickHandler">
    <div class="col">
      <h2>{{heading}}</h2>
      <h6 v-for="subheading in subheadings" :key="subheading">{{ subheading }}</h6>
    </div>

    <div class="col">
      <button
        v-if="actionButton && actionButton.text"
        :class="actionButtonClasses"
        @click.stop="actionClickHandler"
      >{{ actionButton.text }}</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.quiz-session-list-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border: 0.01rem solid rgba(215, 209, 204, 0.28);

  &.clickable {
    cursor: pointer;

    &:hover {
      background: rgba(215, 209, 204, 0.15);
    }
  }

  &.disabled {
    opacity: 0.2;
  }
  .col {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .flex-center {
    align-items: center;
    justify-content: center;
  }

  .action-button {
    display: flex;
    padding: 0.25rem;
    font-size: 0.8rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    min-width: 5rem;
    &.green {
      background: $green;
      color: white;
    }

    &.purple {
      background: rgba(81, 36, 122, 0.2);
      color: rgba(81, 36, 122, 0.9);
    }

    &.text {
      background: none;
      color: $purple;
      border: 0.05em solid $purple;
    }

    &:hover, &:active, &:focus {
      opacity: 0.9;
      outline: none;
    }
  }

  .disable {
    opacity: 0.2;
  }
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
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
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

@Component
export default class QuizSessionListItem extends Vue {
  @Prop({ default: undefined }) private heading!: string;
  @Prop({ default: undefined }) private subheadings!: string[];
  @Prop({ default: undefined }) private actionButton!:
    | { mode: "green" | "purple"; text: string }
    | undefined;
  @Prop({ default: false }) private disabled!: boolean;
  @Prop({ default: false }) private clickable!: boolean;
  @Prop({ default: undefined }) private backgroundColor!: string;

  clickHandler() {
    this.$emit("click");
  }

  actionClickHandler() {
    this.$emit("actionClick");
  }

  get quizItemClasses() {
    return {
      disabled: this.disabled,
      clickable: this.clickable,
    };
  }
  get actionButtonClasses() {
    if (this.actionButton && this.actionButton.mode) {
      const classes: { [key: string]: boolean } = {
        "action-button": true,
        "flex-center": true,
      };

      classes[this.actionButton.mode] = true;

      return classes;
    }

    return undefined;
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
