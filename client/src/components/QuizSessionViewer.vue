<template>
  <div class="quiz-session-viewer">
    <div v-for="(page, i) in pages" :key="page._id">
      <Collapsible :title="`#${i+1} ${page.title}`" :label="pageTypeTitle(page)">
        <QuestionViewer
          v-if="page.type === PageTypes.QUESTION_ANSWER_PAGE"
          :questionPage="page"
          :question="getQuestionForPage(page)"
          :responseWithContent="getQuestionResponseWithContent(page)"
        />
        <DiscussionViewer
          v-if="page.type === PageTypes.DISCUSSION_PAGE"
          :page="page"
          :chatGroup="chatGroup"
          :quizSessionId="quizSession._id"
        />
        <InfoViewer v-if="page.type === PageTypes.INFO_PAGE" :contentLeft="[page.content]" />
        <div></div>
      </Collapsible>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";

import API from "../../../common/js/DB_API";
import {
  AttemptedQuizSessionData,
  Page,
  IResponse,
  IQuestionAnswerPage,
  IQuestionQualitative,
  IQuestion,
  IResponseQualitative,
  IChatGroup,
} from "../../../common/interfaces/DBSchema";
import Collapsible from "./Collapsible.vue";
import { PageType, QuestionType } from "../../../common/enums/DBEnums";
import InfoViewer from "./QuizSessionViewerComponents/InfoViewer.vue";
import QuestionViewer from "./QuizSessionViewerComponents/QuestionViewer.vue";
import DiscussionViewer from "./QuizSessionViewerComponents/DiscussionViewer.vue";
import { getIdToken } from "../../../common/js/front_end_auth";

@Component({
  components: {
    Collapsible,
    InfoViewer,
    QuestionViewer,
    DiscussionViewer,
  },
})
export default class QuizSessionViewer extends Vue {
  @Prop({ default: undefined, required: true })
  private quizSession!: AttemptedQuizSessionData;
  private chatGroup: IChatGroup | null = null;

  get pages() {
    return this.quiz && this.quiz.pages ? this.quiz.pages || [] : [];
  }

  get PageTypes() {
    return PageType;
  }

  get quiz() {
    return this.quizSession && this.quizSession.quiz;
  }

  get questions() {
    return (this.quizSession && this.quizSession.questions) || [];
  }

  get responsesWithContent() {
    return (this.quizSession && this.quizSession.responsesWithContent) || [];
  }

  getQuestionForPage(page: IQuestionAnswerPage): IQuestion | undefined {
    if (!page || !page.questionId) return undefined;
    const question = this.questions.find((q) => q._id === page.questionId);
    return question;
  }

  getQuestionResponseWithContent(
    page: IQuestionAnswerPage
  ): IResponse | undefined {
    if (!page || !page.questionId) return undefined;
    const questionId = page.questionId;

    return this.responsesWithContent.find(
      (r) => r.questionId === page.questionId
    );
  }

  get quizCriterionMaxMarksString(): string {
    return this.quiz &&
      this.quiz.markingConfiguration &&
      this.quiz.markingConfiguration.maximumMarks
      ? `${this.quiz.markingConfiguration.maximumMarks}`
      : "-";
  }

  get overallScoreString() {
    if (
      this.quizSession &&
      this.quizSession.overallScore !== undefined &&
      this.quizSession.overallMaximumMarks
    ) {
      return `${this.quizSession.overallScore}/${this.quizSession.overallMaximumMarks}`;
    }

    return "-";
  }

  pageTypeTitle(page: Page | undefined) {
    if (!page || !page.type) return "";
    switch (page.type) {
      case PageType.DISCUSSION_PAGE:
        return "Discussion";
      case PageType.INFO_PAGE:
        return "Information";
      case PageType.QUESTION_ANSWER_PAGE:
        return "Question";
      default:
        return "";
    }
  }

  async fetchChatGroupForQuizSession() {
    if (!this.quizSession || !this.quizSession._id) return null;
    try {
      const chatGroup = await API.request(
        API.GET,
        API.CHATGROUP + `quizSession/${this.quizSession._id}`,
        {},
        undefined,
        getIdToken()
      );
      if (chatGroup && chatGroup.success && chatGroup.payload) {
        this.chatGroup = chatGroup.payload;
      }
    } catch (e) {
      this.chatGroup = null;
      console.error("Could not fetch chat group");
    }
  }

  async mounted() {
    await this.fetchChatGroupForQuizSession();
  }
}
</script>
<style lang="scss" scoped>
.row {
  display: flex;
}

.row-wrap {
  flex-wrap: wrap;
}

.col {
  display: flex;
  flex-flow: column;
}

/* Tooltip CSS */

.ht:hover {
  cursor: pointer;
  opacity: 0.8;
}

.ht:hover .tooltip {
  display: block;
}

.tooltip {
  display: none;
  background: rgba(1, 0, 0, 0.95);
  color: white;
  margin-left: 28px; /* moves the tooltip to the right */
  margin-top: 15px; /* moves it down */
  position: absolute;
  z-index: 1000;
  padding: 0.5rem;
  border: 0.01em transparent;
  border-radius: 2px;
}
</style>