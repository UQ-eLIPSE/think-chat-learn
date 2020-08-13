<template>
  <div class="contentContainer" :class="question && page.type === PageType.QUESTION_ANSWER_PAGE ? 
        'questionPage' : ''" v-if="page">
    <div class="columns" :class="page.type === PageType.DISCUSSION_PAGE ? 'discussion-page' : ''">
      <div class="column pane1">
        <div v-if="page.type !== PageType.DISCUSSION_PAGE">
          <h2>{{page ? page.title : ""}}</h2>
          <div class="content" v-html="page.content"/>
          <template v-if="question && page.type === PageType.QUESTION_ANSWER_PAGE">
            <h2>{{question ? question.title : ""}}</h2>
            <div
              class="content"
              v-if="question"
              v-html="question.content"
            ></div>
          </template>
        </div>

        <!-- Accordion for Questions and Responses only required on Discussion page -->
        <div class="accordion" v-if="page.type === PageType.DISCUSSION_PAGE && chatGroup">
          <dl>
            <!-- Discussion content -->
            <dt :class="contentPanelOpen ? 'opened' : ''" v-on:click="contentPanelOpen = !contentPanelOpen" v-if="page.content">
              <div class="flex-row align-center justify-space-between">
                <h2>{{page ? page.title : ""}}</h2>
                <font-awesome-icon :icon="contentPanelOpen ? 'chevron-up' : 'chevron-down'" />
              </div>
            </dt>
            <dd :class="contentPanelOpen ? 'opened' : ''" v-if="page.content && contentPanelOpen">
              <div class="content" v-html="page.content"/>
            </dd>

            <!-- Question -->
            <dt :class="questionsPanelOpen ? 'opened' : ''" v-on:click="questionsPanelOpen = !questionsPanelOpen" v-if="question.content">
              <div class="flex-row align-center justify-space-between">
                <h2>{{question ? question.title : ""}}</h2>
                <font-awesome-icon :icon="questionsPanelOpen ? 'chevron-up' : 'chevron-down'" />
              </div>
            </dt>
            <dd :class="questionsPanelOpen ? 'opened' : ''" v-if="questionsPanelOpen && question.content">
              <template>
                <div class="content" v-html="question.content"></div>
              </template>
            </dd>

            <!-- Responses -->
            <dt :class="responsesPanelOpen ? 'opened' : ''" v-on:click="responsesPanelOpen = !responsesPanelOpen" 
                v-if="displayResponsesEnabled && checkResponses()">
              <div class="flex-row align-center justify-space-between">  
                <h2>Responses</h2>
                <font-awesome-icon :icon="responsesPanelOpen ? 'chevron-up' : 'chevron-down'" />
              </div>
            </dt>
            <dd v-if="responsesPanelOpen && displayResponsesEnabled && checkResponses()">
              <div
                v-for="answer in sortedUniqueQuestionGroupAnswers"
                class="content"
                :key="answer._id"
              >
                <ChatMessage :content="answer.answer.content" :numeral="answer.clientIndex" />
              </div>
            </dd>
          </dl>
        </div>
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
                :maxlength="maxAnswerLength"
                placeholder="Explain your response..."
                v-model="currentResponse.content"
              >
              </b-input>
              <b-input
                v-else
                type="textarea"
                :maxlength="maxAnswerLength"
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
        <!-- Handle Chat Page data -->
        <div v-else-if="page.type === PageType.DISCUSSION_PAGE && chatGroup">
          <div class="flex-row align-center justify-space-between">
            <h2>Chat</h2>
            <span class="personal-number">You are <CircularNumberLabel :numeral="chatGroup.clientIndex" /></span>
          </div>
          <Chat :chatMessages="chatMessages"/>
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

    &.discussion-page {
      h2 {
        color: $uq;
        margin: 0 !important;
        padding: 0;
      }
      .confidence {
        margin-bottom: 1em;
        
        label.highlight {
          align-items: center;
          border-radius: 50%;
          display: flex;
          font-weight: 600;
          justify-content: center;
          height: 25px;
          margin-left: 0.5em;
          text-align: center;
          width: 25px;
        }
      }
      .personal-number label[class^='base'] {
        border: 0;
        font-size: 1rem;
        height: 25px;
        margin-top: 0;
        position: relative;
        width: 25px;
      }
      .column {
        padding: 0;
        .flex-row {
          background-color: $white;
          padding: 1em;
        }
        &.pane1 {
          border-right: 1px solid $grey;
          flex-grow: 1.5;
          flex-shrink: 1;
          overflow: scroll;
          max-height: 867px;
        }
        &.pane2 {
          flex-grow: 2;
          flex-shrink: 0;
        }
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
import { WebsocketEvents } from "../../../common/js/WebsocketEvents";
import { WebsocketManager } from "../../../common/js/WebsocketManager";
import { EventBus } from "../EventBus";
import { EmitterEvents } from "../emitters";
import Chat from "../components/Chat/Chat.vue";
import ChatMessage from "../components/Chat/ChatMessage.vue";
import katex from "katex";
import { Conf } from "../../../common/config/Conf";
import { Message } from "../interfaces";
import CircularNumberLabel from "../components/CircularNumberLabel.vue";

@Component({
  components: {
    Confidence,
    ChatMessage,
    Chat,
    CircularNumberLabel
  }
})
export default class PageTemplate extends Vue {

  private contentPanelOpen = true;
  private questionsPanelOpen = false;
  private responsesPanelOpen = true;

  private DEFAULT_RESPONSE = "";
  private DEFAULT_CONFIDENCE = 3;

  /** Only used when its a question page that is qualitative */
  private responseContent: string = "";
  private confidence: number = 3;

  get chatMessages(): Message[] {
    return this.$store.getters.chatMessages;
  }

  get quizSession(): IQuizSession | null {
    return this.$store.getters.quizSession;
  }

  get quiz(): IQuiz | null {
    const quiz = this.$store.getters.quiz;

    if (!quiz) {
      return null;
    }

    return quiz;
  }

  // The idea is based on the quiz and current page,
  // render it appropiately
  get currentIndex(): number {
    return this.$store.getters.currentIndex;
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

  get socketState() {
    return this.$store.getters.socketState;
  }

  get PageType() {
    return PageType;
  }

  get QuestionType() {
    return QuestionType;
  }

  get user(): IUser | null {
    return this.$store.getters.user;
  }

  get maxIndex(): number {
    return this.$store.getters.maxIndex;
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

  /**
   * Returns user responses to questions ordered by answer `clientIndex`
   */
  get sortedUniqueQuestionGroupAnswers() {
    try {
      if (this.chatGroup && this.chatGroup.groupAnswers &&
        this.question && this.question._id &&
        this.chatGroup.groupAnswers[this.question._id]) {

        const sorted =
          this.chatGroup.groupAnswers[this.question._id].sort(
              (a: IWSToClientData.ChatGroupAnswer, b: IWSToClientData.ChatGroupAnswer) => {
            // Make sure clientIndex is truthy or zero before subtracting
            if ((a && (a.clientIndex || a.clientIndex === 0)) &&
              (b && (b.clientIndex || b.clientIndex === 0))) {
              return a.clientIndex - b.clientIndex;
            }

            // if `clientIndex` is not available, ignore sort order and return 0
            // for availability (even if the order is wrong, response is visible)
            return 0;
        });

        const uniqueSorted: IWSToClientData.ChatGroupAnswer[] = [];
        const uniqueMapAnswerId: {[key: string]: boolean} = {};

        sorted.forEach((answer) => {
          if (!answer.answer || !answer.answer._id) { return; }
          if (!uniqueMapAnswerId[answer.answer._id]) {
            uniqueMapAnswerId[answer.answer._id] = true;
            uniqueSorted.push(answer);
          }
        });

        return uniqueSorted;
      }
      return [];
    } catch (e) {
      return [];
    }
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

  get maxAnswerLength() {
    if (Conf && Conf.answers && Conf.answers.justification && Conf.answers.justification.maxLength) {
      return Conf.answers.justification.maxLength;
    }

    return 1000;
  }

  get displayResponsesEnabled() {
    if (this.page && this.page.type === PageType.DISCUSSION_PAGE) {
      return this.page.displayResponses;
    }

    return false;
  }

  private toggleChat: boolean = false;
  private newMessage: boolean | null = false;
  private groupFormed: boolean = false;

  public changeChatState() {
    this.toggleChat = !this.toggleChat;
    this.newMessage = false;
  }

  // In short, if we have a message and the chat is off, notify new message
  @Watch("chatMessages")
  private handleMessageNotification(
    newVal: Message[],
    oldVal: Message[]
  ) {
    if (!this.toggleChat) {
      this.newMessage = true;
    }
  }

  private checkResponses() {
    return this.sortedUniqueQuestionGroupAnswers.some((currentValue) => {
      if (currentValue && currentValue.answer) {
        if (currentValue.answer.type === QuestionType.QUALITATIVE &&
          currentValue.answer.content &&
          currentValue.answer.content.trim()) { return true; }
        if (currentValue.answer.type === QuestionType.MCQ &&
          currentValue.answer.optionId) { return true; }
      }
      return false;
    });
  }

/**
 * Changes visibility of chat window  based on
 * page type and chatGroupFormed status
 */
  @Watch("currentIndex")
  private currentIndexChangeHandler(newVal: boolean, oldVal?: boolean) {
    // this.toggleChat -> true, if
    //  - chat group exists
    //  - current page is discussion page
    //  - (Note that this automatically handles the session re-join condition)

    // this.toggleChat -> false, if
    //  - current page is not discussion page
    //    - (since users complained of chat window covering content)

    // Note: Frequent opening/closing of chat window would (hopefully)
    // signal to users that the chat window can be shown/hidden
    if (this.page && this.page.type !== PageType.DISCUSSION_PAGE) {
      this.toggleChat = false;
    }

    if (this.page && this.page.type === PageType.DISCUSSION_PAGE &&
      this.socketState && this.socketState.chatGroupFormed &&
      this.socketState.chatGroupFormed.groupId) {

      this.toggleChat = true;
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
        .then((responseId) => {
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

        // If responses are to be displayed, fetch user responses from server
        if (this.displayResponsesEnabled) {
          this.emitUpdateRequest();
        }

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

  /**
   * Sends a chat group update request to the server.
   * Essentially, fetches user responses
   */
  private emitUpdateRequest(
    callback?: (data?: IWSToClientData.UserResponseUpdate) => void
  ) {
    try {
      if (
        !this.socket ||
        !this.quiz ||
        !this.quizSession ||
        !this.currentResponse ||
        !this.quizSession._id ||
        !this.currentResponse._id ||
        !this.socketState ||
        !this.socketState.chatGroupFormed
      ) {
        console.error("Sent a update request without a socket or quiz or group");
        return;
      }

      this.socket!.emitData<IWSToServerData.ChatGroupUpdateResponse>(
        WebsocketEvents.OUTBOUND.CHAT_GROUP_UPDATE,
        {
          quizSessionId: this.quizSession!._id!,
          responseId: this.currentResponse!._id!,
          groupId: this.socketState.chatGroupFormed.groupId!
        }
      );
    } catch (e) {
      // TODO: Handle error
      return;
    }
  }

  private mounted() {
    EventBus.$on(EmitterEvents.GROUP_FORMED, () => {
      this.toggleChat = true;
      this.newMessage = false;
      this.groupFormed = true;
    });

    if (!this.quiz || !this.quiz.pages) {
      return;
    }

    // Just check if the maxIndex exceeds the page, if so we push them back to either reflection or receipt
    if (this.maxIndex >= this.quiz.pages.length) {
      this.$router.push("/receipt");
    }

    // Handle the timeout
    EventBus.$on(EmitterEvents.PAGE_TIMEOUT, this.handleTimeOut);
    const formulae = document.getElementsByClassName("ql-formula");

    for (let i = 0; i < formulae.length; i++) {

      const maybeElement = formulae.item(i);

      // Grab all quill formula and then render the appropiate HTML string
      // Using the render function could be done but its more appropiate to override the existing HTML

      if (maybeElement) {
        const html = katex.renderToString(String.raw`${maybeElement.getAttribute("data-value")!}`, {
          throwOnError: true
        });
        maybeElement.innerHTML = html;
      }
    }
  }

  private destroyed() {
    EventBus.$off(EmitterEvents.PAGE_TIMEOUT, this.handleTimeOut);
  }
}
</script>

