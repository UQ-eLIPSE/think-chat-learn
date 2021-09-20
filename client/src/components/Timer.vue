<template>
  <div
    class="timer"
    v-show="['MoocChatPage', 'Discussion', 'Reflection'].includes($route.name)"
  >
    <font-awesome-icon icon="clock" />
    <b>Next page will load in:</b> {{timeLeftInMinutesSeconds}}
  </div>
</template>

<style lang="scss">
.timer {
  background-color: $green;
  border-radius: 20px;
  color: $white;
  font-size: 17px;
  left: 50%;
  margin: 0 auto;
  min-width: 310px;
  padding: 10px;
  text-align: center;
  width: 300px;

  svg {
    margin-right: 0.5em;
  }
}
</style>

<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import { EmitterEvents } from "../emitters";
import { TimerSettings, SocketState } from "../interfaces";
import { EventBus } from "../EventBus";
import { IQuiz, IQuizSession } from "../../../common/interfaces/DBSchema";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";
import { Conf } from "../../../common/config/Conf";

enum FETCH_STATES {
  READY = 0,
  FETCHING = 1,
  DONE = 2
}

@Component({})
export default class Timer extends Vue {
  private isRunning: boolean = false;
  private timeoutHandler: number = -1;
  private fetching: FETCH_STATES = FETCH_STATES.READY;

  // Use Date as setTimeout is not meant to accurate
  private endTime: number = new Date().getTime();
  private startTime: number = new Date().getTime();
  private timeLeftInMinutesSeconds: string = "0:00";

  // E.g. 1 minute = 60000ms
  private MS_TO_MINUTES_FACTOR: number = 60000;
  private MS_TO_SECONDS_FACTOR: number = 1000;
  private TIME_AMOUNT_MS: number = 100;
  // Time to fetch question
  private FETCH_TIME: number = 1;

  get maxIndex(): number {
    return this.$store.getters.maxIndex;
  }

  get quiz(): IQuiz | null {
    return this.$store.getters.quiz;
  }

  get socketState(): SocketState | null {
    return this.$store.getters.socketState;
  }

  get chatGroup(): IWSToClientData.ChatGroupFormed | null {
    return this.socketState && this.socketState.chatGroupFormed ? this.socketState.chatGroupFormed : null;
  }

  get quizSession(): IQuizSession | null {
    return this.$store.getters.quizSession;
  }

  @Watch("isRunning")
  private checkRunningStatus(newVal: boolean, oldVal: boolean) {
    // We only tell the page we have timed if we were previously running
    if (!newVal && oldVal) {
      EventBus.$emit(EmitterEvents.PAGE_TIMEOUT);
    }
  }

  private createNewTimer(newVal: TimerSettings, oldVal?: TimerSettings) {
    const newTime = newVal.timeoutInMins * this.MS_TO_MINUTES_FACTOR;

    // We use the date constructor as its more accurate
    this.endTime = newTime + Date.now();

    window.clearTimeout(this.timeoutHandler);

    this.fetching = FETCH_STATES.READY;

    this.timeoutHandler = window.setInterval(() => {
      const timeLeft = this.endTime - Date.now();

      if (timeLeft <= 0) {
        this.endTime = 0;
        window.clearInterval(this.timeoutHandler);
        this.timeoutHandler = -1;
        this.isRunning = false;
      } else {
        this.timeLeftInMinutesSeconds = this.getTimeLeftInMinutesSeconds(timeLeft);

        if (this.fetching === FETCH_STATES.READY && timeLeft <= this.FETCH_TIME) {
          // Send a page request
          this.fetching = FETCH_STATES.FETCHING;
          if (this.maxIndex + 1 < this.quiz!.pages!.length) {
              this.$store.dispatch("getPage", {
                quizId: this.quiz!._id,
                pageId: this.quiz!.pages![this.maxIndex + 1]._id,
                quizSessionId: this.quizSession!._id,
                groupId: this.chatGroup && this.chatGroup.groupId ? this.chatGroup.groupId : null
              }).then(() => {
                this.fetching = FETCH_STATES.DONE;
              });
          }
        }
      }
    }, this.TIME_AMOUNT_MS);

    this.isRunning = true;
  }

  private getTimeLeftInMinutesSeconds(timeLeft: number): string {
    if (timeLeft <= 0) {
      return `0:00`;
    }

    const minutes = Math.floor(timeLeft / this.MS_TO_MINUTES_FACTOR);
    const seconds = Math.floor(
      (timeLeft - minutes * this.MS_TO_MINUTES_FACTOR) /
        this.MS_TO_SECONDS_FACTOR
    );

    // Padding such that 1 second left is rendered as X:01
    return `${minutes.toString()}:${seconds.toString().padStart(2, "0")}`;
  }

  // When the timer is instantiated for the first time
  private mounted() {
    EventBus.$on(EmitterEvents.START_TIMER, this.handleCreateTimer);
  }

  // Handles a new time setting
  private handleCreateTimer(data: TimerSettings) {
    if (data && data.referencedPageId !== "") {
      this.createNewTimer(data);
    }
  }

  get stopBrowser() {
    return this.$store.getters.stopBrowser;
  }

  @Watch("stopBrowser")
  private handleCrash(newVal: boolean, oldVal?: boolean) {
    if (newVal) {
      window.clearTimeout(this.timeoutHandler);
    }
  }
}
</script>
