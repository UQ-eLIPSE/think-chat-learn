<template>
  <div
    class="container center"
    v-if="user"
  >
    <h1>Thank you, {{ user.firstName }} for completing these questions!</h1>
    <label class="attempt">
      <font-awesome-icon icon="star" />&nbsp;<b>Attempt ID:</b> {{receipt}}</label>
    <div class="content">
      <p>
        If you need to discuss your <b>MOOCchat</b> in the future,<br />
        please provide this ID in your communications.
      </p>
    </div>

    <button
      class="primary"
      @click="logout()"
      type="button"
      v-if="user"
    >
      Logout
    </button>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

.container {
  padding: 4em 0;
  width: 80%;
  label.attempt {
    background-color: rgba(254, 173, 0, 0.1);
    border: 3px solid $baseLight3;
    border-radius: 10px;
    color: $baseLight3;
    display: inline-block;
    font-size: 1.5em;
    margin-top: 1.5em;
    padding: 10px 40px;
  }
  .content {
    margin: 3em 0;
    p {
      color: $text;
      font-size: 1.25em;
    }
  }
}
</style>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import {
  IQuiz,
  IQuizSession,
  IChatGroup,
  IUser,
  IUserSession
} from "../../../common/interfaces/ToClientData";
import { logout } from "../../../common/js/front_end_auth";
import { SocketState } from "../interfaces";
import { WebsocketManager } from "../../js/WebsocketManager";
import { WebsocketEvents } from "../../js/WebsocketEvents";
import * as IWSToServerData from "../../../common/interfaces/IWSToServerData";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";

@Component({})
export default class Receipt extends Vue {
  // Note that the receipt is essentially the quizSessionId with a flag of true
  // To make sure the receipt is legitmate, we retrieve the get request again
  private receipt: string = "";

  get maxIndex(): number {
    return this.$store.getters.maxIndex;
  }

  get quiz(): IQuiz | null {
    return this.$store.getters.quiz;
  }

  get quizSession(): IQuizSession | null {
    return this.$store.getters.quizSession;
  }

  get socketState(): SocketState | null {
    return this.$store.getters.socketState;
  }

  get socket(): WebsocketManager | null {
    return this.socketState && this.socketState.socket
      ? this.socketState.socket
      : null;
  }

  get chatGroup(): IWSToClientData.ChatGroupFormed | null {
    return this.socketState && this.socketState.chatGroupFormed
      ? this.socketState.chatGroupFormed
      : null;
  }

  get user(): IUser | null {
    return this.$store.getters.user;
  }

  private mounted() {
    // Even though we store the quiz session id, we need to make sure that the maxIndex >= the number of pages
    // and also check if its in the db.
    if (
      this.quizSession &&
      this.quizSession._id &&
      this.quiz &&
      this.quiz.pages &&
      this.maxIndex >= this.quiz.pages.length
    ) {
      this.$store
        .dispatch("retrieveQuizSession", this.quizSession._id)
        .then(() => {
          // Due to async functions we have to do this check again
          if (this.quizSession && this.quizSession._id) {
            const reg = this.quizSession._id.match(/.{1,4}/g);

            if (!reg) {
              throw Error(`Could not apply regex to ${this.quizSession._id}`);
            }

            this.receipt = reg.join(" ");
          }
        });
    }
  }

  private logout() {
    // Logging out is simply a matter of calling the socket event and removing the store values.
    if (
      this.socket &&
      this.quizSession &&
      this.chatGroup &&
      this.quizSession._id
    ) {
      this.socket.emitData<IWSToServerData.Logout>(
        WebsocketEvents.OUTBOUND.LOGOUT,
        {
          quizSessionId: this.quizSession._id,
          groupId: this.chatGroup.groupId
        }
      );

      this.$store.dispatch("finishSession");
      window.location.href = "https://learn.uq.edu.au";
    }
  }
}
</script>
