<template>
  <div class="container center">
    <h1>Searching for others to join...</h1>
    <ProgressLoader :percentLoaded="percentLoadedByTime" />
    <p>You’ll be teamed up with a group discussion shortly.</p>
    <br />
    <p>
      If you do not progress to a chat within the time limit, return to Blackboard and try again; if this does not resolve your issue, please contact your course coordinator.
    </p>
    <span class="notifyTone">
      <b-switch v-model="notifyTone"></b-switch>
      <span>Play
        <b>notification tone</b> when my group is ready (keep window/tab open)
      </span>
    </span>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

.container {
  padding: 4em 0;
  width: 80%;

  .notifyTone {
    display: flex;
    justify-content: center;
    margin-top: 4em;
  }
}
</style>
<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import ProgressLoader from "../components/ProgressLoader.vue";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";
import { SocketState, TimerSettings } from "../interfaces";
import { EventBus } from "../EventBus";
import { EmitterEvents } from "../emitters";
import { Conf } from "../../../common/config/Conf";

@Component({
  components: {
    ProgressLoader
  }
})
export default class GroupAllocation extends Vue {
  get socketState(): SocketState | null {
    return this.$store.getters.socketState;
  }

  get percentLoadedByTime() {
    const waitTime = Conf.timings.chatGroupFormationTimeoutMs;
    return Math.round((this.timeElapsed / waitTime) * 100);
  }

  get chatGroup(): IWSToClientData.ChatGroupFormed | null {
    return this.socketState && this.socketState.chatGroupFormed
      ? this.socketState.chatGroupFormed
      : null;
  }
  private notifyTone: boolean | null = null;
  private notifyAudio: HTMLAudioElement | null = null;
  private timeElapsed: number = 100;

  public initLoaderTimeout(timeElapsedInMs: number, timerReference?: any) {
    this.timeElapsed = timeElapsedInMs;
    if (timeElapsedInMs < Conf.timings.chatGroupFormationTimeoutMs) {
      const timerRef = setTimeout(() => {
        this.initLoaderTimeout(timeElapsedInMs + 1000, timerRef);
      }, 1000);
    } else {
      clearTimeout(timerReference);
    }
  }

  private goToPage() {
    this.$router.push("/page");
  }
  // Automatically redirect page back if somehow made it to this point
  private mounted() {
    if (this.chatGroup) {
      this.goToPage();
    }

    // Set timeout for loader
    this.initLoaderTimeout(500);
  }

  // Preload the tone to slightly faster access
  @Watch("notifyTone")
  private handleNotifyChange(newVal: boolean, oldVal?: boolean) {
    if (!this.notifyAudio && newVal) {
      this.notifyAudio = new Audio("./mp3/here-i-am.mp3");
    }
  }

  @Watch("chatGroup")
  private async handleChatGroupChange(
    newVal: IWSToClientData.ChatGroupFormed | null,
    oldVal: IWSToClientData.ChatGroupFormed | null
    ) {
    if (newVal) {
      // Play the tone if applicable
      if (this.notifyTone && this.notifyAudio) {
        this.notifyAudio.play();
      }

      this.goToPage();
      EventBus.$emit(
        EmitterEvents.START_TIMER,
        this.$store.getters.currentTimerSettings
      );
      EventBus.$emit(EmitterEvents.GROUP_FORMED);
    }
  }
}
</script>
