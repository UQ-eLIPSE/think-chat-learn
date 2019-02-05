<template>
  <div class="magic">
    <div class="columns">
      <div class="column pane1">
        <h1>Receipt</h1>
        <p v-if="receipt">Your Receipt is {{receipt}}. Keep this as a reference</p>
      </div>
      <div class="column pane2">
        <template v-if="user">
          <button class="primary" @click="logout()" type="button">Logout</button>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.magic {
  height: 100%;
  h3 {
    display: inline-block;
    margin-right: 1em;
  }
  .columns {
    height: 100%;
    margin-bottom: 0;
    margin-left: 0;
    margin-right: 0;
    margin-top: 0;
    .column {
      padding: 2em 3em 3em 3em;
      &.pane1 {
      }

      &.pane2 {
        background-color: #fafafa;
      }
    }
  }
}
</style>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { IQuiz, IQuizSession, IUser } from "../../../common/interfaces/ToClientData";
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
      return this.socketState && this.socketState.socket ? this.socketState.socket : null;
    }

    get chatGroup(): IWSToClientData.ChatGroupFormed | null {
      return this.socketState && this.socketState.chatGroupFormed ? this.socketState.chatGroupFormed : null;
    }

    get user(): IUser | null {
      return this.$store.getters.user;
    }

    private mounted() {
        // Even though we store the quiz session id, we need to make sure that the maxIndex >= the number of pages
        // and also check if its in the db.
        if (this.quizSession && this.quizSession._id && this.quiz && this.quiz.pages
          && (this.maxIndex >= this.quiz.pages.length)) {
            this.$store.dispatch("retrieveQuizSession", this.quizSession._id).then(() => {
                // Due to async functions we have to do this check again
                if (this.quizSession && this.quizSession._id && this.quizSession.complete) {
                    const reg = (this.quizSession._id).match(/.{1,4}/g);

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
      if (this.socket && this.quizSession && this.chatGroup && this.quizSession._id) {
        this.socket.emitData<IWSToServerData.Logout>(WebsocketEvents.OUTBOUND.LOGOUT, {
            quizSessionId: this.quizSession._id,
            groupId: this.chatGroup.groupId
        });
      }
    }
}
</script>
