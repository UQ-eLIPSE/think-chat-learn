<template>
  <div class="contentContainer" v-if="page">
    <div class="columns">
      <div class="column pane1">
        <h1>{{page ? page.title : ""}}</h1>
        <div class="content" v-html="page.content"/>
        <template v-if="question && page.type === PageType.QUESTION_ANSWER_PAGE">
          <h1>{{question ? question.title : ""}}</h1>
          <div
            class="content"
            v-if="question"
            v-html="question.content"
          ></div>
        </template>
      </div>
      <!-- For now only question answer pages have this -->
      <div class="column pane2">
        <div v-if="page.type === PageType.QUESTION_ANSWER_PAGE">
          <h2>Your Response</h2>
          <b-field v-if="question">
            <template v-if="question.type === QuestionType.QUALITATIVE">
              <b-input
                v-if="currentResponse"
                :disabled="true"
                type="textarea"
                minlength="10"
                maxlength="500"
                placeholder="Explain your response..."
                v-model="currentResponse.content"
              >
              </b-input>
              <b-input
                v-else
                type="textarea"
                minlength="10"
                maxlength="500"
                placeholder="Explain your response..."
                v-model="responseContent"
              >
              </b-input>
            </template>
            <div v-else-if="QuestionType.MCQ === question.type">
              <p
                v-for="option in question.options"
                :key="option._id"
              >
                {{option.content}}
              </p>
            </div>
          </b-field>
          <Confidence
            :currentResponse="currentResponse"
            @CONFIDENCE_CHANGE="handleConfidenceChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.contentContainer {
  height: 100%;
  .columns {
    height: 100%;
    margin-bottom: 0;
    margin-left: 0;
    margin-right: 0;
    margin-top: 0;
    .column {
      padding: 2em 3em 3em 3em;
      &.pane2 {
        background-color: #fafafa;
      }
    }
  }
}

.disabled {
  background-color: #eff2f4;
}
</style>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import Confidence from "../components/Confidence.vue";
import { IQuiz, Page, Response, TypeQuestion,
  IQuizSession, IUserSession, IQuestionAnswerPage, IDiscussionPage,
  IUser } from "../../../common/interfaces/ToClientData";
import { PageType, QuestionType } from "../../../common/enums/DBEnums";
import { SocketState, TimerSettings, Dictionary } from "../interfaces";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../../common/interfaces/IWSToServerData";
import { WebsocketEvents } from "../../js/WebsocketEvents";
import { WebsocketManager } from "../../js/WebsocketManager";
import { EventBus } from "../EventBus";
import { EmitterEvents } from "../emitters";

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

  get maxIndex(): number {
    return this.$store.getters.maxIndex;
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
    if (
      this.quiz &&
      this.quiz.pages &&
      this.currentIndex < this.quiz.pages.length
    ) {
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
    if (
      !this.page ||
      !(
        this.page.type === PageType.QUESTION_ANSWER_PAGE ||
        this.page.type === PageType.DISCUSSION_PAGE
      )
    ) {
      return null;
    }

    return this.$store.getters.getQuestionById(this.page.questionId);
  }

  get socketState(): SocketState | null {
    return this.$store.getters.socketState;
  }

  get socket(): WebsocketManager | null {
    return this.socketState && this.socketState.socket
      ? this.socketState.socket
      : null;
  }

  // Empty should be default behaviour if no socket state is present
  get chatMessages(): IWSToClientData.ChatGroupMessage[] {
    return this.socketState ? this.socketState.chatMessages : [];
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

  get responses(): Dictionary<Response> {
    return this.$store.getters.responses;
  }

  get currentResponse(): Response | null {
    if (!this.question) {
      return null;
    }

    return this.responses[this.question._id!];
  }

  get userSession(): IUserSession | null {
    return this.$store.getters.userSession;
  }

  get currentDiscussionQuestion(): TypeQuestion | null {
    return this.$store.getters.currentDiscussionQuestion;
  }

  get currentMaxQuestion(): TypeQuestion | null {
    if (!this.quiz || !this.quiz.pages || !this.quiz.pages[this.maxIndex]) {
      return null;
    }

    switch (this.quiz.pages[this.maxIndex].type) {
      case PageType.DISCUSSION_PAGE:
      case PageType.QUESTION_ANSWER_PAGE:
        return this.$store.getters.getQuestionById(
          (this.quiz.pages[this.maxIndex] as
            | IDiscussionPage
            | IQuestionAnswerPage).questionId
        );
      default:
        return null;
    }
  }

  private handleConfidenceChange(confidenceValue: number) {
    this.confidence = confidenceValue;
  }

  private sendResponse() {
    // If there is no question on the max index we don't care
    if (
      !this.quiz ||
      !this.currentMaxQuestion ||
      !this.quiz._id ||
      !this.quizSession ||
      !this.quizSession._id ||
      !this.quiz.pages
    ) {
      return Promise.resolve();
    }

    // Accomodate for the two types of responses
    // TODO implement MCQ
    let response: Response;
    if (this.currentMaxQuestion.type === QuestionType.QUALITATIVE) {
      response = {
        type: QuestionType.QUALITATIVE,
        content: this.responseContent,
        confidence: this.confidence,
        questionId: (this.quiz.pages[this.maxIndex] as IQuestionAnswerPage)
          .questionId!,
        quizId: this.quiz._id,
        quizSessionId: this.quizSession._id
      };

      // TODO, snackbar for errors?
      return this.$store
        .dispatch("sendResponse", response)
        .then(responseId => {
          this.responseContent = "";
        })
        .catch((e: Error) => {
          console.log(e);
        });
    } else {
      return Promise.resolve();
    }
  }

  // A clear page is defined as resetting the confidence and response content back to defualt values
  private clearPage() {
    this.responseContent = this.DEFAULT_RESPONSE;
    this.confidence = this.DEFAULT_CONFIDENCE;
  }

  // Goes to a page based on the number provided. Defaults to max
  private goToPage(pageNumber: number = this.maxIndex) {
    if (!this.quiz || !this.quiz.pages) {
      return;
    }

    // Redirect to reflection if the index is larger than the page length
    if (pageNumber >= this.quiz.pages.length) {
      this.$router.push("/receipt");
    }

    // Even if we go to the reflection page, we set the current index regardless
    // such that the tracker is in place
    this.$store.dispatch("setCurrentIndex", pageNumber);
  }

  // Increments the max index to allow users to go to next page
  // after going to previous pages. Note we also handle the discussion question
  private incrementMaxIndex() {
    this.$store.dispatch("updateCurrentDiscussion", this.maxIndex + 1);
    this.$store.dispatch("incrementMaxIndex");
  }

  // Handles when the timer is done, the user would have then be pushed to the
  // next page while checking if the response needs to be sent
  // We also increment the max index
  private async handleTimeOut() {
    if (!this.quiz || !this.quiz.pages || !this.quiz.pages[this.maxIndex] || !this.quizSession) {
      return;
    }

    if (this.quiz.pages[this.maxIndex].type === PageType.QUESTION_ANSWER_PAGE) {
      await this.sendResponse();
    }

    this.incrementMaxIndex();
    this.goToPage();

  }

  private async fetchPage(numTries: number) {
    let outcome = true;
    if (this.maxIndex + 1 < this.quiz!.pages!.length) {
        outcome = await this.$store.dispatch("getPage", {
          quizId: this.quiz!._id,
          pageId: this.quiz!.pages![this.maxIndex + 1]._id,
          quizSessionId: this.quizSession!._id,
          groupId: this.chatGroup && this.chatGroup.groupId ? this.chatGroup.groupId : null
        });
    }
  }

  // If this page becomes a discussion page, handles the instantiation of the sockets and the sessions in the db
  @Watch("maxIndex")
  private handlePageChange(newVal: number | null, oldVal: number | null) {
    if (!this.quiz || !this.userSession || !this.quiz.pages) {
      console.error("Missing quiz or user session");
      return;
    }

    if (
      newVal &&
      newVal < this.quiz.pages.length &&
      this.quiz.pages[newVal].type === PageType.DISCUSSION_PAGE
    ) {
      // Upon changing to a discussion page, if we are in a group we need to check if the group state
      // is good. If it is then we proceed as normal. If we don't have a group go to the allocation page
      if (
        this.socketState &&
        this.socketState.chatGroupFormed &&
        this.currentIndex === this.maxIndex
      ) {
        // TODO handle a a bad group/check group state
        const data = {
          questionId: this.currentDiscussionQuestion!._id!,
          groupId: this.chatGroup!.groupId!
        };

        EventBus.$emit(EmitterEvents.START_TIMER, this.$store.getters.currentTimerSettings);
      } else {
        this.$router.push("/allocation");
        this.emitJoinRequest(() => {
          return;
        });
      }
    } else {
      EventBus.$emit(
        EmitterEvents.START_TIMER,
        this.$store.getters.currentTimerSettings
      );
    }
  }

  // Sends a join request to the server. Once completed, runs the callback to instantiate an actual textbox
  private emitJoinRequest(
    callback: (data?: IWSToClientData.ChatGroupFormed) => void
  ) {
    if (
      !this.socket ||
      !this.quiz ||
      !this.quizSession ||
      !this.currentResponse ||
      !this.quizSession._id ||
      !this.currentResponse._id ||
      !this.socketState
    ) {
      console.error("Sent a join request without a socket or quiz");
      return;
    } else if (this.socketState.chatGroupFormed) {
      console.error(
        "Attempted to send a join request while already in a group"
      );
      return;
    }

    this.socket!.emitData<IWSToServerData.ChatGroupJoin>(
      WebsocketEvents.OUTBOUND.CHAT_GROUP_JOIN_REQUEST,
      {
        quizId: this.quiz._id!,
        questionId: this.question!._id!,
        quizSessionId: this.quizSession!._id!,
        responseId: this.currentResponse!._id!,
        userId: this.user!._id!
      }
    );
  }

  private mounted() {
    if (!this.quiz || !this.quiz.pages) {
      return;
    }

    // Just check if the maxIndex exceeds the page, if so we push them back to either reflection or receipt
    if (this.maxIndex >= this.quiz.pages.length) {
      this.$router.push("/receipt");
    }

    // Handle the timeout
    EventBus.$on(EmitterEvents.PAGE_TIMEOUT, this.handleTimeOut);
  }

  private destroyed() {
    EventBus.$off(EmitterEvents.PAGE_TIMEOUT, this.handleTimeOut);
  }
}
</script>
