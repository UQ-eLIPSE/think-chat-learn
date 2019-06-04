<template>
  <v-content class="landing">
    <!-- Only one piece of content required for submission -->
    <h2>Questions</h2>
    <v-form v-for="question in questions" :key="question._id">
      <h3>Title: {{question.title}}</h3>
      <v-content v-html="relevantDiscussionQuestion.content"></v-content>
      <v-textarea
        outline
        minlength="1"
        maxlength="500"
        placeholder="Place sample response"
        v-model="responseContent[question._id]"
      ></v-textarea>
    </v-form>
    <v-btn @click="createIntermediate()">Create Intermediate Session</v-btn>
    <!-- Socket state content -->
    <v-content v-if="socket">
      <h2>Pool Details</h2>
      Pool Size: {{poolSize}} at Time {{new Date(refreshTime)}} with {{formattedTimeout}} remaining.
    </v-content>
    <h2>Quiz Session List</h2>
    <v-content v-for="token in tokens" :key="token">
      <v-content>
      <p>Redirect as <a :href="'http://localhost:8080/client/#/login?q=' + token">here. </a></p>
      <p>State: {{ validSessions[decodedTokenReferences[token]] === undefined ? "Need to send a join request" :
          (validSessions[decodedTokenReferences[token]] ? "In a group" : "Waiting for a group") }}</p>
      <v-btn v-if="validSessions[decodedTokenReferences[token]] === undefined || validSessions[decodedTokenReferences[token]]" type="button" @click="sendJoinRequest(token)">Send Join Request</v-btn>
      <v-btn v-else @click="sendUnJoinRequest(token)">Unjoin pool</v-btn>
      </v-content>
    </v-content>
  </v-content>
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
import { TypeQuestion, Response, IntermediateLogin } from "../../../common/interfaces/ToClientData";
import { SocketState, TimerSettings } from "../interfaces";
import { EventBus } from "../EventBus";
import { EmitterEvents } from "../emitters";
import { PageType, QuestionType } from "../../../common/enums/DBEnums";
import { WebsocketManager } from "../../../common/js/WebsocketManager";
import { WebsocketEvents } from "../../../common/js/WebsocketEvents";
import { decodeToken } from "../../../common/js/front_end_auth";

@Component({})
export default class Landing extends Vue {

    private responseContent: {[key: string]: string} = {};
    private pingHandle: number = -1;

    get QuestionType() {
      return QuestionType;
    }

    get user(): IUser | null {
      return this.$store.getters.user;
    }

    get userSession(): IUserSession | null {
      return this.$store.getters.userSession;
    }

    get quiz(): IQuiz | null {
      return this.$store.getters.quiz;
    }

    get quizSession(): IQuizSession | null {
      return this.$store.getters.quizSession;
    }

    get responses(): Response[] | null {
      if (this.quizSession) {
        return this.$store.getters.responses;
      } else {
        return null;
      }
    }

    get questions(): TypeQuestion[] {
      return this.$store.getters.questions;
    }

    get socket():  WebsocketManager | null {
      return this.$store.getters.socketState && this.$store.getters.socketState.socket ? this.$store.getters.socketState.socket : null;
    }

    get poolSize(): number {
      return this.$store.getters.poolSize;
    }

    get refreshTime(): number {
      return this.$store.getters.refreshTime;
    }

    get timeoutTime(): number {
      return this.$store.getters.timeoutTime;
    }

    get formattedTimeout(): string {
      const minutes = Math.floor(this.timeoutTime / (60 * 1000));
      const seconds = Math.floor((this.timeoutTime - (minutes * 60 * 1000)) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    get tokens(): string[] {
      return this.$store.getters.tokens;
    }

    get decodedTokenReferences(): {[key: string]: string} {
      return this.tokens.reduce((acc: {[key: string]: string}, token) => {
        acc[token] = decodeToken(token).quizSessionId;
        return acc;
      }, {});
    }

    get validSessions(): {[key: string]: boolean} {
      return this.$store.getters.validSessions;
    }

    get relevantDiscussionQuestion(): TypeQuestion | null {
      // Based from the quiz, map the id to the relevant question
      if (this.quiz && this.quiz.pages) {
        for (let i = 0 ; i < this.quiz.pages.length; i++) {
          const page = this.quiz.pages[i];

          if (page.type === PageType.DISCUSSION_PAGE) {
            // First instance of page types only
            return this.$store.getters.getQuestionById(page.questionId);
          }
        }
      }

      return null;
    }

    private decodeToken(token: string) {
      return decodeToken(token);
    }

    private async createIntermediate() {
      // Hard code confidence to 3
      const outgoingResponses: Partial<Response>[] = [];

      const responseKeys = Object.keys(this.responseContent);

      for (let i = 0 ; i < responseKeys.length; i++) {
        outgoingResponses.push({
          type: QuestionType.QUALITATIVE,
          content: this.responseContent[responseKeys[i]],
          questionId: responseKeys[i],
          confidence: 3
        });
      }
      await this.$store.dispatch("createIntermediate", outgoingResponses);

      // Create an association of this socket with the new id
      // Find the associated discussion response
      this.responses!.forEach((response) => {
        // Redundant sends are not much of an issue
        if (response.questionId === this.relevantDiscussionQuestion!._id) {
          this.socket!.emitData<IWSToServerData.StoreSession>(
            WebsocketEvents.OUTBOUND.STORE_QUIZ_SESSION_SOCKET,
            {
              quizSessionId: response.quizSessionId!
            }
          );
        }
      });
    }

    private sendUnJoinRequest(token: string) {
      const loginResponse: IntermediateLogin = decodeToken(token);
      this.socket!.emitData<IWSToServerData.ChatGroupJoin>(
        WebsocketEvents.OUTBOUND.CHAT_GROUP_UNJOIN_REQUEST,
        {
          quizId: this.quiz!._id!,
          questionId: this.relevantDiscussionQuestion!._id!,
          quizSessionId: this.quizSession!._id!,
          responseId: loginResponse.responseId,
          userId: this.user!._id!
        }
      );

      // Set the join state to false. Remember false means not in a group
      this.$store.dispatch("removeValidSession", loginResponse.quizSessionId);
    }

    private sendJoinRequest(token: string) {
      // Decode the token and then send a join request based on its content
      // This is to grab the appropiate response
      const loginResponse: IntermediateLogin = decodeToken(token);
      this.socket!.emitData<IWSToServerData.ChatGroupJoin>(
        WebsocketEvents.OUTBOUND.CHAT_GROUP_JOIN_REQUEST,
        {
          quizId: this.quiz!._id!,
          questionId: this.relevantDiscussionQuestion!._id!,
          quizSessionId: this.quizSession!._id!,
          responseId: loginResponse.responseId,
          userId: this.user!._id!
        }
      );

      // Set the join state to false. Remember false means not in a group
      this.$store.dispatch("unsetValidSession", loginResponse.quizSessionId);
    }

    private async mounted() {
      // Instantiate the socket and quiz session immediately
      const outgoingQuizSession: IQuizSession = {
        quizId: this.quiz!._id,
        userSessionId: this.userSession!._id,
        responses: []
      };

      await this.$store.dispatch("createQuizSession", outgoingQuizSession);
      await this.$store.dispatch("createSocket");
      this.socket!.emitData<IWSToServerData.StoreSession>(
        WebsocketEvents.OUTBOUND.STORE_QUIZ_SESSION_SOCKET,
        {
          quizSessionId: this.quizSession!._id!
        }
      );
      // Create a timer for the ping
      this.pingHandle = window.setInterval(() => {
        if (this.socket) {
          const input: IWSToServerData.ChatGroupStatus = {
            quizId: this.quiz && this.quiz._id ? this.quiz._id : "",
            questionId: this.relevantDiscussionQuestion && this.relevantDiscussionQuestion._id ? this.relevantDiscussionQuestion._id : "",
            userId: this.user && this.user._id ? this.user._id : ""
          };
          this.socket.emitData<IWSToServerData.ChatGroupStatus>(WebsocketEvents.OUTBOUND.CHAT_PING, input);
        }
      }, 5000);
    }
}
</script>
