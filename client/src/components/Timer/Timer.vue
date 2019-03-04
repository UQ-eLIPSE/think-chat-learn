<template>
  <div
    class="timer"
    v-show="['MoocChatPage', 'Discussion', 'Reflection'].includes($route.name)"
  >
    <b>Time remaining:</b> {{timeLeftInMinutesSeconds}}
  </div>
</template>

<style lang="scss">
@import "../../../css/variables.scss";
.timer {
  background-color: rgba(96, 175, 161, 0.15);
  border: 3px solid $baseDark1;
  border-radius: 5px;
  color: $baseDark1;
  font-size: 20px;
  margin: 0 auto;
  padding: 8px 8px;
  text-align: center;
  width: 250px;
}
</style>

<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import { EmitterEvents } from "../../emitters";
import { TimerSettings } from "../../interfaces";
import { EventBus } from "../../EventBus";

@Component({})
export default class Timer extends Vue {
  private isRunning: boolean = false;
  private timeoutHandler: number = -1;

  // Use Date as setTimeout is not meant to accurate
  private endTime: number = new Date().getTime();
  private startTime: number = new Date().getTime();
  private timeLeftInMinutesSeconds: string = "0:00";

  // E.g. 1 minute = 60000ms
  private MS_TO_MINUTES_FACTOR: number = 60000;
  private MS_TO_SECONDS_FACTOR: number = 1000;
  private TIME_AMOUNT_MS: number = 100;

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

    this.timeoutHandler = window.setInterval(() => {
      const timeLeft = this.endTime - Date.now();

      if (timeLeft <= 0) {
        this.endTime = 0;
        window.clearInterval(this.timeoutHandler);
        this.timeoutHandler = -1;
        this.isRunning = false;
      } else {
        this.timeLeftInMinutesSeconds = this.getTimeLeftInMinutesSeconds(
          timeLeft
        );
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
