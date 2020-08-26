<template>
  <div>
    <h1>Feedback</h1>
  </div>
</template>

<style lang="scss" scoped>

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
export default class Feedback extends Vue {
  @Prop({ default: undefined }) private quizSession!: any;
  @Prop({ default: undefined }) private marks!: any;
  @Prop({ default: undefined }) private responses!: any;

  mounted() {
    // get marks

    // get responses
  }
  
}
</script>
