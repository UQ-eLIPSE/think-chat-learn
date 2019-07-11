<template>
  <v-stepper v-model="currentStepString">
    <v-stepper-header>
        <!-- Note the binding of step is 1-indexed strings but the complete field can be a boolean of our choice -->
        <v-stepper-step :complete="currentStep > 1" step="1">Enter response data</v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="2">Join the waiting pool</v-stepper-step>
    </v-stepper-header>
    <v-stepper-items>
      <v-stepper-content step="1">
        <!-- We only need one copy of the responses to generate the sessions -->
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
        <v-btn @click="currentStep = MAX_STEP; upsertIntermediate()">Continue</v-btn>
      </v-stepper-content>
    <v-stepper-content step="2">
      <!-- Socket state content -->
      <v-content v-if="socket">
        <h2>Pool Details</h2>
        Pool Size: {{poolSize}} at Time {{new Date(refreshTime)}} with {{formattedTimeout}} remaining.
      </v-content>
      <h2>Quiz Session List</h2>
      <v-content v-for="token in tokens" :key="token">
        <v-content>
        <p v-if="validSessions[decodedTokenReferences[token]]">Redirect as <a :href="'http://localhost:8080/client/#/login?q=' + token">here. </a></p>
        <p>State: {{ validSessions[decodedTokenReferences[token]] === undefined ? "Need to send a join request" :
            (validSessions[decodedTokenReferences[token]] ? "In a group" : "Waiting for a group") }}</p>
        <v-btn v-if="validSessions[decodedTokenReferences[token]] === undefined || validSessions[decodedTokenReferences[token]]" type="button" @click="sendJoinRequest(token)">Send Join Request</v-btn>
        <v-btn v-else @click="sendUnJoinRequest(token)">Unjoin pool</v-btn>
        </v-content>
      </v-content>
      <v-btn @click="currentStep = currentStep - 1">Back</v-btn>
      </v-stepper-content>
    </v-stepper-items>
  </v-stepper>
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

// Number of steps that the system can handle
const MAX_STEP = 2;

@Component({})
export default class Landing extends Vue {
    private currentStep: number = 1;
    private currentStepString: string = this.currentStep.toString();
    private responseContent: {[key: string]: string} = {};
    private pingHandle: number = -1;

    @Watch("currentStep")
    private handleNewStepString(val: string, oldVal ?: string) {
      this.currentStepString = this.currentStep.toString();
    }

    get MAX_STEP() {
      return MAX_STEP;
    }

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

    get socket(): WebsocketManager | null {
      return this.$store.getters.socketState &&
        this.$store.getters.socketState.socket ? this.$store.getters.socketState.socket : null;
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
        for (const page of this.quiz.pages) {

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

    private async upsertIntermediate() {
      // Hard code confidence to 3
      const outgoingResponses: Array<Partial<Response>> = [];

      const responseKeys = Object.keys(this.responseContent);

      for (const key of responseKeys) {

        let maybeQuizSessionId = "";
        let maybeResponseId;
        if (this.responses && this.responses.length && this.responses[0].quizSessionId) {
          maybeQuizSessionId = this.responses[0].quizSessionId;

          // Note that the questionId and quizSessionId makes a unique resposne
          const maybeResponse = this.responses.find((response) => {
            return response.questionId === key;
          });
          maybeResponseId = maybeResponse ? maybeResponse._id || "" : "";
        }

        outgoingResponses.push({
          type: QuestionType.QUALITATIVE,
          content: this.responseContent[key],
          questionId: key,
          confidence: 3,
          quizSessionId: maybeQuizSessionId ? maybeQuizSessionId : undefined,
          _id: maybeResponseId ? maybeResponseId : undefined
        });
      }

      // Pitfall, this.responses is changed during the function call which may cause unreliable data.
      if (this.responses && this.responses.length && this.responses[0].quizSessionId) {
        await this.$store.dispatch("updateResponses", outgoingResponses);
      } else {
        await this.$store.dispatch("createIntermediate", outgoingResponses);
      }

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

      // Populate the responses with empty strings
      this.questions.forEach((question) => {
        this.responseContent[question._id!] = "";
      });

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
            questionId: this.relevantDiscussionQuestion &&
              this.relevantDiscussionQuestion._id ? this.relevantDiscussionQuestion._id : "",
            userId: this.user && this.user._id ? this.user._id : ""
          };
          this.socket.emitData<IWSToServerData.ChatGroupStatus>(WebsocketEvents.OUTBOUND.CHAT_PING, input);
        }
      }, 5000);
    }
}
</script>
