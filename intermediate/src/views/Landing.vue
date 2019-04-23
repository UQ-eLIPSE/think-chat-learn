<template>
  <div class="landing">
  </div>
</template>

<style lang="scss" scoped>
</style>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import {
  IUser,
  IQuiz,
  IQuizSession,
  IUserSession
} from "../../../common/interfaces/ToClientData";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../../common/interfaces/IWSToServerData";
import { SocketState, TimerSettings } from "../interfaces";
import { EventBus } from "../EventBus";
import { EmitterEvents } from "../emitters";

@Component({})
export default class Landing extends Vue {
    private mounted() {
      // Instantiate the socket
      this.$store.dispatch("createSocket");
    }
}
</script>
