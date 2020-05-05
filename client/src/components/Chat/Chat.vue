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
    
    <CreateChatMessage />
    <!-- </div> -->
  </div>
</template>

<style lang="scss" scoped>
.chat {
  background-color: #f7f8f8;

  .message-container {
    height: 50vh;
    overflow: scroll;
    padding: 1.25em;
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

  private scrollToEnd() {
    const container = document.querySelector(".message-container");
    if (container) {
      const scrollHeight = container.scrollHeight;
      container.scrollTop = scrollHeight;
    }
  }

  private mounted() {
    this.scrollToEnd();
  }

  private updated() {
    this.scrollToEnd();
  }

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
