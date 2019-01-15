<template>
  <div class="magic">
    <div class="columns">
      <div class="column pane1">
        <h1>{{page ? page.title : ""}}</h1>
        <div class="content" v-html="page.content"/>
      </div>
      <!-- For now only question answer pages have this -->
      <div class="column pane2" v-if="page.type === PageType.QUESTION_ANSWER_PAGE">
        <h2>Your Response</h2>
        <b-field v-if="question">
          <b-input
            type="textarea"
            minlength="10"
            maxlength="500"
            placeholder="Explain your response..."
            v-model="responseContent"
            v-if="question.type === QuestionType.QUALITATIVE"
          >
          </b-input>
          <div v-else-if="QuestionType.MCQ === question.type">
            <p v-for="option in question.options" :key="option._id">
              {{option.content}}
            </p>
          </div>          
        </b-field>
        <Confidence @CONFIDENCE_CHANGE="handleConfidenceChange" />
        <button class="primary" @click="sendResponse()">Submit</button>
      </div>
      <!-- An info page only needs a next page -->
      <div class="column pane2" v-else-if="page.type === PageType.INFO_PAGE">
        <button class="primary" @click="goToNextPage()">Go To Next Page</button>
      </div>
      <!-- Handle Chat Page data -->
      <div class="column pane2" v-else-if="page.type === PageType.DISCUSSION_PAGE && chatGroup">
        <!-- Note a lot of things have to be done to get here -->
        <div v-for="answer in chatGroup.groupAnswers[question._id]" class="content" :key="answer._id">
          {{`Client ${answer.clientIndex} wrote this: ${answer.answer.content} with a confidence of ${answer.answer.confidence}`}}
        </div>
      </div> 
    </div>
  </div>
</template>

<style lang="scss" scoped>
.magic {
  height: 100%;
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
import { Vue, Component, Watch } from "vue-property-decorator";
import Confidence from "../components/Confidence.vue";
import { IQuiz, Page, Response, TypeQuestion,
  IQuizSession, IUserSession } from "../../../common/interfaces/ToClientData";
import { PageType, QuestionType } from "../../../common/enums/DBEnums";
import { SocketState } from "../interfaces";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../../common/interfaces/IWSToServerData";
import { WebsocketEvents } from "../../js/WebsocketEvents";
import { WebsocketManager } from "../../js/WebsocketManager";
import { IUser } from "../../../common/interfaces/DBSchema";

@Component({
  components: {
    Confidence
  }
})
export default class MoocChatPage extends Vue {
  private DEFAULT_RESPONSE = "";
  private DEFAULT_CONFIDENCE = 3;

  /** Only used when its a question page that is qualitative */
  private responseContent: string = "";
  private confidence: number = 3;

  get PageType() {
    return PageType;
  }

  get QuestionType() {
    return QuestionType;
  }

  get user(): IUser | null {
    return this.$store.getters.user;
  }

  get quizSession(): IQuizSession | null {
    return this.$store.getters.quizSession;
  }

  // The idea is based on the quiz and current page,
  // render it appropiately
  get currentIndex(): number {
    return this.$store.getters.currentIndex;
  }

  get quiz(): IQuiz | null {
    const quiz = this.$store.getters.quiz;

    if (!quiz) {
      return null;
    }

    return quiz;
  }

  // If we get an out of bound for the pages, set to null
  get page(): Page | null {
    if (this.quiz && this.quiz.pages && (this.currentIndex < this.quiz.pages.length)) {
      return this.quiz.pages[this.currentIndex];
    } else {
      return null;
    }
  }

  // Gets the current page type, used for watching. Returns null if
  // no page exists
  get currentPageType(): PageType | null {
    if (!this.page) {
      return null;
    }

    return this.page.type;
  }

  get question(): TypeQuestion | null {
    if (!this.page || !((this.page.type === PageType.QUESTION_ANSWER_PAGE) || (this.page.type === PageType.DISCUSSION_PAGE))) {
      return null;
    }

    return this.$store.getters.getQuestionById(this.page.questionId);
  }

  get socketState(): SocketState| null {
    return this.$store.getters.socketState;
  }

  get socket(): WebsocketManager | null {
    return this.socketState && this.socketState.socket ? this.socketState.socket : null;
  }

  // Empty should be default behaviour if no socket state is present
  get chatMessages(): IWSToClientData.ChatGroupMessage[] {
    return this.socketState ? this.socketState.chatMessages : [];
  }

  get chatGroup(): IWSToClientData.ChatGroupFormed | null {
    return this.socketState && this.socketState.chatGroupFormed ? this.socketState.chatGroupFormed : null;
  }

  get typingNotifications(): IWSToClientData.ChatGroupTypingNotification | null {
    return this.socketState && this.socketState.chatTypingNotifications ?
      this.socketState.chatTypingNotifications : null;
  }

  get response(): Response | null {
    return this.$store.getters.response;
  }

  get userSession(): IUserSession | null {
    return this.$store.getters.userSession;
  }

  private handleConfidenceChange(confidenceValue: number) {
    this.confidence = confidenceValue;
  }

  private sendResponse() {
    // If there is no question, don't run
    if (!this.question || !this.question._id || !this.quiz ||
      !this.quiz._id || !this.quizSession || !this.quizSession._id) {
      return;
    }

    // Accomodate for the two types of responses
    // TODO implement MCQ
    let response: Response;
    if (this.question.type === QuestionType.QUALITATIVE) {
      response = {
        type: QuestionType.QUALITATIVE,
        content: this.responseContent,
        confidence: this.confidence,
        questionId: this.question._id,
        quizId: this.quiz._id,
        quizSessionId: this.quizSession._id
      };

      // TODO, snackbar for errors?
      this.$store.dispatch("sendResponse", response).then(() => {
        this.goToNextPage();
      }).catch((e: Error) => {
        console.log(e);
      });
    }
  }

  // A clear page is defined as resetting the confidence and response content back to defualt values
  private clearPage() {
    this.responseContent = this.DEFAULT_RESPONSE;
    this.confidence = this.DEFAULT_CONFIDENCE;
  }

  // Goes the to the next page by incrementing the count
  // Additionally does a quiz page check to see if the reflection page should be touched
  private goToNextPage() {
    if (!this.quiz || !this.quiz.pages) {
      return;
    }

    this.$store.dispatch("incrementIndex");

    // Not safe to go to the next page, go to reflection
    if (this.currentIndex + 1 > this.quiz.pages.length) {
      this.$router.push("/reflection");
    }
  }

  // If this page becomes a discussion page, handles the instantiation of the sockets and the sessions in the db
  @Watch("currentPageType")
  private handlePageTypeChange(newVal: PageType | null, oldVal: PageType | null) {
    if (newVal && newVal === PageType.DISCUSSION_PAGE) {

      if (!this.quiz || !this.userSession) {
        console.log("Missing quiz or user session");
        return;
      }

      const outgoingQuizSession: IQuizSession = {
          quizId: this.quiz!._id,
          userSessionId: this.userSession!._id,
          responses: []
      };

      this.emitJoinRequest(() => {
        return;
      });
    }
  }

  // Sends a join request to the server. Once completed, runs the callback to instantiate an actual textbox
  private emitJoinRequest(callback: (data?: IWSToClientData.ChatGroupFormed) => void) {
      if (!this.socketState || !this.quiz || !this.socketState.socket
        || !this.quizSession || !this.response || !this.quiz.pages || !this.quizSession._id || !this.response._id) {
          throw Error("Sent a join request without a socket or quiz");
      }

      this.socket!.emitData<IWSToServerData.ChatGroupJoin>(WebsocketEvents.OUTBOUND.CHAT_GROUP_JOIN_REQUEST, {
          quizId: this.quiz._id!,
          questionId: this.question!._id!,
          quizSessionId: this.quizSession!._id!,
          responseId: this.response!._id!,
          userId: this.user!._id!
      });
  }
}
</script>
