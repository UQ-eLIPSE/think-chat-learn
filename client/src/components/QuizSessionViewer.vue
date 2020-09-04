<template>
  <div class="quiz-session-viewer">

    <div v-for="(page, i) in pages" :key="page._id">
      <Collapsible :title="`#${i+1} ${page.title}`" :label="pageTypeTitle(page)">
        <QuestionViewer v-if="page.type === PageTypes.QUESTION_ANSWER_PAGE"
          :questionPage="page"
          :question="getQuestionForPage(page)" :responseWithContent="getQuestionResponseWithContent(page)" />
        <div v-if="page.type === PageTypes.DISCUSSION_PAGE">Discussion</div>
        <InfoViewer v-if="page.type === PageTypes.INFO_PAGE"
          :contentLeft="[page.content]"  />
        <div>

        </div>
      </Collapsible>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";

import API from "../../../common/js/DB_API";
import { AttemptedQuizSessionData, Page, IResponse, IQuestionAnswerPage, IQuestionQualitative, IQuestion, IResponseQualitative } from "../../../common/interfaces/DBSchema";
import Collapsible from './Collapsible.vue';
import { PageType, QuestionType } from "../../../common/enums/DBEnums";
import InfoViewer from "./QuizSessionViewerComponents/InfoViewer.vue";
import QuestionViewer from "./QuizSessionViewerComponents/QuestionViewer.vue";
import { getIdToken } from "../../../common/js/front_end_auth";

@Component({
  components: {
    Collapsible,
    InfoViewer,
    QuestionViewer
  }
})
export default class QuizSessionViewer extends Vue {
  @Prop({ default: undefined, required: true }) private quizSession!: AttemptedQuizSessionData;

  get pages() {
    return this.quiz && this.quiz.pages? this.quiz.pages || [] : [];
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
    if(!page || !page.questionId) return undefined;
    const question = this.questions.find((q) => q._id === page.questionId);
    return question;
  }

  getQuestionResponseWithContent(page: IQuestionAnswerPage): IResponse | undefined {
    if(!page || !page.questionId) return undefined;
    const questionId = page.questionId;
    
    return this.responsesWithContent.find((r) => r.questionId === page.questionId);
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
    if(!page || !page.type) return "";
    switch(page.type) {
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