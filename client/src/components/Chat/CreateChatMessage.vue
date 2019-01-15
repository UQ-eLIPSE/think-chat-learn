<template>
  <div class="create-chat-message">
    <textarea
      type="text"
      placeholder="Share your ideas"
      @focus="sendTypingState(true)" @blur="sendTypingState(false)"
      v-model="loadedMessage"
      :disabled="!canType"
    />
    <button class="secondary" @click="sendMessage()">Send</button>
  </div>
</template>

<style lang="scss" scoped>
.create-chat-message {
  textarea {
    border: none;
    font-family: "Open Sans", sans-serif;
    font-size: 0.75em;
    height: 81px;
    margin: 0px;
    resize: none;
    width: 100%;

    &::placeholder {
      color: #b2b3b4;
    }

    &:focus {
      outline: 0;
    }
  }
  button.secondary {
    font-size: 0.8em;
  }
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import { IQuizSession, IQuiz, Response } from "../../../../common/interfaces/ToClientData";
import { WebsocketManager } from "../../../js/WebsocketManager";
import { WebsocketEvents } from "../../../js/WebsocketEvents";
import { SocketState } from "../../interfaces";


@Component({})
export default class CreateChatMessage extends Vue {
  private loadedMessage: string = "";

  get quiz(): IQuiz | null {
    return this.$store.getters.quiz;
  }

  get quizSession(): IQuizSession | null {
    return this.$store.getters.quizSession;
  }

  get response(): Response | null {
    return this.$store.getters.response;
  }

  get socketState(): SocketState {
    return this.$store.getters.socketState;
  }

  get socket(): WebsocketManager | null {
    return this.socketState && this.socketState.socket ? this.socketState.socket : null;
  }

  get groupJoin(): IWSToClientData.ChatGroupFormed | null {
    return this.socketState && this.socketState.chatGroupFormed ? this.socketState.chatGroupFormed : null;
  }

  get canType(): boolean {
    if (!this.quiz || !this.quizSession || !this.response || !this.socket || !this.quizSession || !this.groupJoin) {
      return false;
    }
    return true;
  }

  // Sends the typing state to the listening sockets to the group, including self!
  private sendTypingState(state: boolean) {

    // TODO form questionId connection and discussion page in the db and admin page
    if (this.canType) {
      const output: IWSToServerData.ChatGroupTypingNotification = {
        isTyping: state,
        quizId: this.quiz!._id!,
        questionId: this.quiz!.pages![0]._id!,
        quizSessionId: this.quizSession!._id!,
        responseId: this.response!._id!,
        groupId: this.groupJoin!.groupId!
      };

      this.socket!.emitData<IWSToServerData.ChatGroupTypingNotification>(
        WebsocketEvents.OUTBOUND.CHAT_GROUP_TYPING_NOTIFICATION, output);
    }
  }

  private sendMessage() {
    // Sends a message to the server. Note that we do
    // not preload messages (as in push local messages to itself immediately)
    if (!this.canType) {
      console.log("Attempted to send message in a bad typing state");
      return;
    }

    const message: IWSToServerData.ChatGroupSendMessage = {
        message: this.loadedMessage,
        groupId: this.groupJoin!.groupId!,
        quizId: this.quiz!._id!,
        questionId: this.quiz!.pages![0]._id!,
        quizSessionId: this.quizSession!._id!,
        responseId: this.response!._id!
    };

    this.socket!.emitData<IWSToServerData.ChatGroupSendMessage>(
      WebsocketEvents.OUTBOUND.CHAT_GROUP_SEND_MESSAGE, message);
  }
}
</script>
