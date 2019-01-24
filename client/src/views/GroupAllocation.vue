<template>
  <div class="container center">
    <h1>Searching for others to join...</h1>
    <ProgressLoader percentLoaded="88" />
    <p>You’ll be teamed up with a group discussion shortly.</p>
    <br />
    <p>
      If you do not progress to a chat within the time limit, return to
      Blackboard and try again; if this does not resolve your issue, please
      contact your course coordinator.
    </p>
    <span class="notifyTone">
      <b-switch></b-switch>
      <span>Play <b>notification tone</b> when my group is ready (keep window/tab
        open)</span>
    </span>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

.container {
  padding: 4em 0;

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

@Component({
  components: {
    ProgressLoader
  }
})
export default class GroupAllocation extends Vue {
  private notifyTone: boolean | null = null;

  get socketState(): SocketState | null {
    return this.$store.getters.socketState;
  }

  get chatGroup(): IWSToClientData.ChatGroupFormed | null {
    return this.socketState && this.socketState.chatGroupFormed ? this.socketState.chatGroupFormed : null;
  }

  private goToMoocChatPage() {
    this.$router.push("/page");
  }

  private mounted() {
    if (this.chatGroup) {
      this.goToMoocChatPage();
    }
  }

  @Watch("chatGroup")
  private handleChatGroupChange(newVal: IWSToClientData.ChatGroupFormed | null,
    oldVal: IWSToClientData.ChatGroupFormed | null) {
      if (newVal) {
        this.goToMoocChatPage();
        EventBus.$emit(EmitterEvents.START_TIMER, this.$store.getters.currentTimerSettings);
      }
  }
}
</script>
