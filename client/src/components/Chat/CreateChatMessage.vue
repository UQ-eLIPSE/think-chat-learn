<template>
  <div class="relative">
    <div class="create-chat-message">
      <textarea
        minlength="10"
        maxlength="1024"
        type="text"
        placeholder="Share your ideas"
        @keydown.enter.exact.prevent
        @keyup.enter.exact="sendMessage"
        @keydown.enter.shift.exact="newline"
        @keydown="resetTimer()"
        v-model="loadedMessage"
        :disabled="!canType"
      />
      <button class="chat-submit" @click="sendMessage()">
        <font-awesome-icon icon="paper-plane" />
      </button>
    </div>
    <div class="counter flex-align-end">
      <span>{{loadedMessage.length}}/<b>1024</b></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.create-chat-message {
  align-items: center;
  background-color: $white;
  border-top: 1px solid $grey;
  display: flex;
  height: 100px;
  padding: 15px;

  textarea {
    border: none;
    font-family: "Open Sans", sans-serif;
    font-size: 0.75em;
    margin: 0px;
    resize: none;
    height: 100%;
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

.counter {
  background: $white;
  bottom: 0;
  color: $dark-grey;
  display: flex;
  font-size: 0.69em;
  padding-bottom: 5px;
  padding-right: 15px;
  position: absolute;
  right: 0;
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import * as IWSToServerData from "../../../../common/interfaces/IWSToServerData";
import * as IWSToClientData from "../../../../common/interfaces/IWSToClientData";
import {
  IQuizSession,
  IQuiz,
  Response,
  IUser,
  IDiscussionPage,
  TypeQuestion,
  Page
} from "../../../../common/interfaces/ToClientData";
import { WebsocketManager } from "../../../../common/js/WebsocketManager";
import { WebsocketEvents } from "../../../../common/js/WebsocketEvents";
import { SocketState, Dictionary } from "../../interfaces";
import { PageType } from "../../../../common/enums/DBEnums";

// Amount of time to send a false state
const TIMEOUT = 2000;

@Component({})
export default class CreateChatMessage extends Vue {
  private loadedMessage: string = "";
  private MAX_LENGTH: number = 1024;
  private typingStateHandle: number = -1;

  private newline() {
    this.loadedMessage = `${this.loadedMessage}`;
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

  get responses(): Dictionary<Response> {
    return this.$store.getters.responses;
  }

  get referredQuestion(): TypeQuestion {
    return this.$store.getters.currentDiscussionQuestion;
  }

  get socketState(): SocketState {
    return this.$store.getters.socketState;
  }

  get socket(): WebsocketManager | null {
    return this.socketState && this.socketState.socket
      ? this.socketState.socket
      : null;
  }

  get groupJoin(): IWSToClientData.ChatGroupFormed | null {
    return this.socketState && this.socketState.chatGroupFormed
      ? this.socketState.chatGroupFormed
      : null;
  }

  get maxIndex(): number {
    return this.$store.getters.maxIndex;
  }

  get currentPage(): Page | null {
    if (!this.quiz || !this.quiz.pages) {
      return null;
    }

    return this.quiz.pages[this.maxIndex];
  }

  get canType(): boolean {
    if (
      !this.quiz ||
      !this.quizSession ||
      !this.socket ||
      !this.quizSession ||
      !this.groupJoin ||
      !this.referredQuestion ||
      !this.currentPage ||
      this.currentPage.type !== PageType.DISCUSSION_PAGE
    ) {
      return false;
    }
    return true;
  }

  get disabledText(): string {
    if (!this.canType) {
      // Basic diagnosis would be to only consider discussion page and current group. It would be very concerning
      // if the socket was null for instance
      if (!this.groupJoin) {
        return "Chat is currently disabled as you're not part of a group yet";
      } else if (
        this.currentPage &&
        this.currentPage.type !== PageType.DISCUSSION_PAGE
      ) {
        return "Chat is currenly disabled as your group is not on a discussion page";
      }

      return "Chat is currently disabled";
    } else {
      return "";
    }
  }

  /**
   * Function used to send typing notifications to server
   * `resetTimer()` is called every time a user presses a key in chat box
   */
  private resetTimer() {

  if (this.typingStateHandle === -1) {
      /**
       * If `typingStateHandle === -1`, this means either:
       *  - User has not started typing
       *  - User continues typing after `TIMEOUT` seconds of not typing
       *    - In these cases, send typing notification to the server
       */
      this.sendTypingState(true);
    }

    /**
      * Refresh existing typing handle timeout and re-assign new timer
      *  - When user continues to type within `TIMEOUT` seconds, the `typingStateHandle`
      *    is effectively "extended" without sending a notification to the server
      */
    
    window.clearTimeout(this.typingStateHandle);
    this.typingStateHandle = window.setTimeout(() => {
      // When the user stops typing, wait for `TIMEOUT` ms before notifying server
      this.sendTypingState(false);
      // remember to unassign the handle
      this.typingStateHandle = -1;
    }, TIMEOUT);

  }

  // Used shift + enter keypress for a new line in chat window
  private newLine() {
    this.loadedMessage = `${this.loadedMessage}\n`;
  }

  // Sends the typing state to the listening sockets to the group, including self!
  private sendTypingState(state: boolean) {
    // TODO form questionId connection and discussion page in the db and admin page
    const output: IWSToServerData.ChatGroupTypingNotification = {
      isTyping: state,
      quizSessionId: this.quizSession!._id!,
      groupId: this.groupJoin!.groupId!
    };

    this.socket!.emitData<IWSToServerData.ChatGroupTypingNotification>(
      WebsocketEvents.OUTBOUND.CHAT_GROUP_TYPING_NOTIFICATION, output);
    }

  private sendMessage() {
    // Sends a message to the server. Note that we do
    // not preload messages (as in push local messages to itself immediately). Also note that the we should not be able
    // to send empty messages. We could to save our selves memory, to only allow messages of certain lengths
    // right now the messages will be trunctated to 1024 characters
    if (!this.canType || this.loadedMessage === "") {
      console.log("Attempted to send message in a bad typing state");
      return;
    }

    const message: IWSToServerData.ChatGroupSendMessage = {
      message: this.loadedMessage.slice(0, this.MAX_LENGTH),
      groupId: this.groupJoin!.groupId!,
      questionId: this.referredQuestion!._id!,
      quizSessionId: this.quizSession!._id!,
      userId: this.user!._id!
    };

    this.socket!.emitData<IWSToServerData.ChatGroupSendMessage>(
      WebsocketEvents.OUTBOUND.CHAT_GROUP_SEND_MESSAGE,
      message
    );

    this.loadedMessage = "";

    // Immediately set the typing state to false and handle the timer. Clear the timer for due diligence
    if (this.typingStateHandle !== -1) {
      window.clearTimeout(this.typingStateHandle);
      this.typingStateHandle = -1;
    }
    this.sendTypingState(false);
  }
}
</script>
