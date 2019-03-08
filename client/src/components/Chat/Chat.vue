<template>
  <div class="chat">
    <!-- <div v-bind="messages" v-for="message in messages"> -->
    <div class="message-container">
      <div
        v-for="(message, index) in chatMessages"
        :key="index"
      >
        <ChatMessage
          v-if="message.type === MoocChatMessageTypes.CHAT_MESSAGE"
          :userNumber="`Client ${message.content.clientIndex}`"
          :content="message.content.message"
          :numeral="message.content.clientIndex"
        />
        <ChatAlert
          v-else-if="(message.type === MoocChatMessageTypes.STATE_MESSAGE)"
          :alertMessage="message.message"
          :alertType="`standard`"
        />
      </div>
      <!-- Note since is typing notification is always last. We can render it to the bottom like this
           Also note that the div above is simply a wrapper. Template cannot be used -->
      <template v-if="chatGroup">
        <ChatMessage
          v-for="typingNotif in clientNotifications"
          :key="'typingNotif' + typingNotif"
          :userNumber="`Student ${typingNotif + 1}`"
          :content="`Student ${typingNotif + 1} is typing`"
          :numeral="typingNotif + 1"
          :isTyping="true"
        />
      </template>
    </div>

    <div class="input-container">
      <CreateChatMessage />
    </div>
    <!-- </div> -->
  </div>
</template>

<style lang="scss" scoped>
@import "../../../css/variables.scss";

.chat {
  background-color: #f7f8f8;
  bottom: 0;
  box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.15);
  height: 100vh;
  padding-top: 75px;
  position: fixed;
  right: 0;
  width: 400px;
  z-index: 1;

  .message-container {
    height: calc(100vh - 263px);
    overflow: scroll;
    padding: 15px;
  }

  .input-container {
    background-color: $white;
    height: 188px;
    position: absolute;
    bottom: 0;
    width: 100%;
    padding: 15px;
  }
}
</style>

<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import ChatAlert from "./ChatAlert.vue";
import ChatMessage from "./ChatMessage.vue";
import CreateChatMessage from "./CreateChatMessage.vue";
import { SocketState, MoocChatMessage } from "../../interfaces";
import { MoocChatMessageTypes, MoocChatStateMessageTypes } from "../../enums";
import * as IWSToClientData from ",,/../../../common/interfaces/IWSToClientData";
import {
  IQuiz,
  IDiscussionPage,
  TypeQuestion
} from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";

@Component({
  components: {
    ChatAlert,
    ChatMessage,
    CreateChatMessage
  }
})
export default class Chat extends Vue {
  @Prop({ default: () => [] }) private chatMessages!: MoocChatMessage[];

  get socketState(): SocketState | null {
    return this.$store.getters.socketState;
  }

  get MoocChatMessageTypes() {
    return MoocChatMessageTypes;
  }

  get MoocChatStateMessageTypes() {
    return MoocChatStateMessageTypes;
  }

  get clientNotifications(): number[] {
    return this.socketState && this.socketState.chatTypingNotifications
      ? this.socketState.chatTypingNotifications.clientIndicies
      : [];
  }

  get chatGroup(): IWSToClientData.ChatGroupFormed | null {
    return this.socketState && this.socketState.chatGroupFormed
      ? this.socketState.chatGroupFormed
      : null;
  }

  get typingNotifications(): IWSToClientData.ChatGroupTypingNotification | null {
    return this.socketState && this.socketState.chatTypingNotifications
      ? this.socketState.chatTypingNotifications
      : null;
  }
}
</script>
