<template>
  <v-container class="marking-section" fluid grid-list-md>
    <!-- Highly unlikely we need to re-render. Index as key is fine -->
    <v-layout row wrap>
      <!-- Use template due to strict formatting of Vuetify's grid system of container -> layout -> flex -->
      <template v-for="(c, index) in content">
        <v-flex xs6 :key="`title-${index}`">
          <h3 v-if="c.type === ContentType.PAGE" >Page Content for {{c.page.title}}</h3>
          <h3 v-else-if="c.type === ContentType.RESPONSE" >Response for question - {{c.questionTitle}}</h3>
          <h3 v-else-if="c.type === ContentType.CHAT" >Chat content for discussion -  {{c.questionTitle}}</h3>
        </v-flex>
        <v-flex xs6 :key="`button-${index}`" text-xs-right>
          <v-btn @click="toggleVisibility(index)">
            {{ c.visible ? "Hide " : "Show " }} <v-icon right>{{c.visible ? "visibility_off" : "visibility"}}</v-icon>
          </v-btn>
        </v-flex>        
        <v-flex xs12 :key="`content-${index}`">
          <div v-if="c.type === ContentType.PAGE && c.visible" class="page-container">
            <div v-html="c.page.content"/>
            <div class="question-wrapper" v-if="c.page.type === PageType.QUESTION_ANSWER_PAGE">
              <h4>Question Content - {{getQuestionById(c.page.questionId).title}}</h4>
              <div v-html="getQuestionById(c.page.questionId).content"/>
            </div>
          </div>
          <div v-else-if="c.type === ContentType.RESPONSE && c.visible" class="responses-container">
            <div class="responses message-container"
              v-if="c.responses && c.responses.length > 0">
              <ChatMessage v-for="r in c.responses"
              :key="r._id"
              :selected="responseBelongsTocurrentQuizSessionInfoObject(r.quizSessionId)"
              :numeral="getNumeralFromQuizSessionId(r.quizSessionId)"
              :content="r.content" />
            </div>
            <div v-if="!c.responses || !c.responses.length > 0">
              <span>No responses available</span>
            </div>
          </div>
          <div v-else-if="c.type === ContentType.CHAT && c.visible" class="chat-messages">
            <div class="message-container"
              v-if="c.messages && c.messages.length > 0">
              <ChatMessage v-for="m in c.messages"
              :key="m._id"
              :selected="responseBelongsTocurrentQuizSessionInfoObject(m.quizSessionId)"
              :numeral="getNumeralFromQuizSessionId(m.quizSessionId)"
              :content="m.content" />
            </div>
            <div v-if="!c.messages || !c.messages.length">
              <span>No chat messages available</span>
            </div>
          </div>
        </v-flex>
      </template>
      <v-flex class="row" xs12>
        <MarkingComponent class="marking-component"></MarkingComponent>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage, IQuestion,
  IQuestionAnswerPage, IQuizSession, IUserSession, IUser, IChatGroup,
  Response, QuizSessionDataObject, IPage, IChatMessage } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import ChatMessage from "./ChatMessage.vue";
import MarkingComponent from "./MarkingComponent.vue";
import { CurrentMarkingContext } from "../../store/modules/quiz";

// Since we are dumping the entire page here, we need to know what content there is to render
enum ContentType {
  PAGE = "PAGE",
  RESPONSE = "RESPONSE",
  CHAT = "CHAT"
}

interface Content {
  type: ContentType;
  visible: boolean;
}

interface PageContent extends Content {
  type: ContentType.PAGE;
  page: IPage;
}

interface ResponseContent extends Content {
  type: ContentType.RESPONSE;
  responses: Response[];
  questionTitle: string;
}

interface ChatContent extends Content {
  type: ContentType.CHAT;
  messages: IChatMessage[];
  questionTitle: string;
}

type GenericContent = PageContent | ResponseContent | ChatContent;


@Component({
  components: {
    ChatMessage,
    MarkingComponent
  }
})
export default class MarkQuizMarkingSection extends Vue {

  private content: GenericContent[] = [];

  get ContentType() {
    return ContentType;
  }

  get PageType() {
    return PageType;
  }

  get currentQuizSessionInfoObject(): QuizSessionDataObject | undefined {
    return this.$store.getters.currentQuizSessionInfoObject;
  }

  get currentMarkingContext(): CurrentMarkingContext {
    return this.$store.getters.currentMarkingContext;
  }

  get chatMessages() {
    if (!this.$store.getters.currentChatGroupQuestionMessages) { return []; }
    return this.$store.getters.currentChatGroupQuestionMessages;
  }

  get currentChatGroupResponsesMap() {
    return this.$store.getters.currentChatGroupResponsesMap || [];
  }
  get currentChatGroupQuestionMessageMap() {
    return this.$store.getters.currentChatGroupQuestionMessageMap || [];
  }

  public messageBelongsTocurrentQuizSessionInfoObject(qid: string): boolean {
    if (!this.currentQuizSessionInfoObject || !this.currentQuizSessionInfoObject.quizSession) { return false; }
    return (this.currentQuizSessionInfoObject.quizSession._id === qid);
  }

  get currentChatGroup() {
    return this.$store.getters.currentChatGroup;
  }
  public responseBelongsTocurrentQuizSessionInfoObject(qid: string): boolean {
    if (!this.currentQuizSessionInfoObject || !this.currentQuizSessionInfoObject.quizSession) { return false; }
    return (this.currentQuizSessionInfoObject.quizSession._id === qid);
  }
  public getNumeralFromQuizSessionId(qid: string) {
    if (!this.currentChatGroup || !this.currentChatGroup.quizSessionIds) { return 1; }
    const ind = this.currentChatGroup.quizSessionIds.indexOf(qid);
    if (ind === -1) { return 1; }
    return ind + 1;
  }

  private getQuestionById(id: string): IQuestion | undefined {
    return this.$store.getters.getQuestionById(id);
  }

  // Current quiz for marking purposes
  get currentQuiz(): IQuiz {
    return this.$store.getters.currentQuiz;
  }

  private mounted() {
    this.content = this.initializeContent();
  }

  // This generates the order in which the quiz will be rendered.
  // Don't use computed as we toggle the visibility
  private initializeContent(): GenericContent[] {
    // Traverse the quiz to grab the page
    const output: GenericContent[] = [];
    this.currentQuiz.pages!.forEach((page) => {
      // Push the page regardless
      output.push({
        type: ContentType.PAGE,
        page,
        visible: true
      });

      if (page.type === PageType.QUESTION_ANSWER_PAGE) {
        // Fetch the appropiate response

        if (this.currentQuizSessionInfoObject) {
          const maybeResponses = this.currentChatGroupResponsesMap[page.questionId];
          const referredQuestion = this.getQuestionById(page.questionId);
          if (maybeResponses) {
            output.push({
              type: ContentType.RESPONSE,
              responses: maybeResponses,
              visible: true,
              questionTitle: referredQuestion ? referredQuestion.title! : "N/A - No question"
            });
          }
        }
      } else if (page.type === PageType.DISCUSSION_PAGE) {
        if (this.currentChatGroupQuestionMessageMap) {
          const maybeChat = this.currentChatGroupQuestionMessageMap[page.questionId];
          const referredQuestion = this.getQuestionById(page.questionId);
          if (maybeChat) {
            output.push({
              type: ContentType.CHAT,
              messages: maybeChat,
              visible: true,
              questionTitle: referredQuestion ? referredQuestion.title! : "N/A - No question"
            });
          }
        }
      }
    });
    return output;
  }

  // Basic filtered content if needed
  private getContentByType(type: ContentType) {
    return this.content.filter((content) => {
      return content.type === type;
    });
  }

  // Toggles the visibility of a content component based on the indx
  private toggleVisibility(index: number) {
    this.content[index].visible = !this.content[index].visible;
  }
}
</script>
<style lang="scss" scoped>
@import "../../../css/variables.scss";
.sidebar {
  color: white;
  text-shadow: rgb(85, 85, 85) 0.05em 0.05em 0.05em;
  width: 18rem;
  font-size: 1.2rem;
  overflow-y: hidden;
  background: rgb(150, 85, 102);
}

.course-name {
  font-style: italic;
  margin: 1rem 2rem 1.5rem;
}

h1 {
  line-height: 1;
  margin: 2rem 2rem 1rem;
}

.question-box {
  display: flex;
  flex-direction: column;
  border: 0.1em solid teal;
  padding: 0.5rem;
}

.marking-section {
  display: flex;
  flex-direction: column;
}

.marking-section>* {
  margin: 1rem 0;
}

.chat {
  background-color: #f7f8f8;
  box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.15);
  /* max-height: 30vh; */
  width: 100%;
  overflow: auto;

  .message-container {
    max-height: 100%;
    overflow: auto;
    padding: 15px;
  }
}

.row {
  display: flex;
  width: 100%;
  height: 70vh;
}

.chat-messages {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  max-height: 30vh;
  overflow: scroll;
}

.responses-container {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  max-height: 30vh;
  overflow: auto; // width: 50%;
}

.marking-component {
  flex-shrink: 0;
}

.column {
  display: flex;
  flex-direction: column;
  max-width: 50%;
}
</style>