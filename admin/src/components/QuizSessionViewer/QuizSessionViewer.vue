<template>
  <div class="quiz-session-viewer">
  <div v-for="page in pages" :key="page._id">
      <Collapsible class="marking-collapsible" :title="`${page.title}`" :label="pageTypeTitle(page)">
          <QuestionViewer
            v-if="page.type === PageTypes.QUESTION_ANSWER_PAGE"
            :questionPage="page"
            :question="getQuestionForPage(page)"
            :responseWithContent="getQuestionResponseForPage(page)"
          />
          <DiscussionViewer
            v-if="page.type === PageTypes.DISCUSSION_PAGE"
            :page="page"
            :chatGroup="currentChatGroup"
            :quizSessionId="currentQuizSessionId"
          />
          <InfoViewer v-if="page.type === PageTypes.INFO_PAGE" :contentLeft="[page.content]" />
      </Collapsible>
  </div>
  </div>
</template>
 
<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { IQuestionAnswerPage, QuizSessionDataObject } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import Collapsible from "../../elements/Collapsible.vue";
import QuestionViewer from "../QuizSessionViewer/QuestionViewer.vue";
import DiscussionViewer from "../QuizSessionViewer/DiscussionViewer.vue";
import InfoViewer from "../QuizSessionViewer/InfoViewer.vue";
import { IQuestion, IQuiz, IResponse, Page } from "../../../../common/interfaces/DBSchema";

@Component({
  components: {
    Collapsible,
    QuestionViewer,
    DiscussionViewer,
    InfoViewer
  }
})
export default class QuizSessionViewer extends Vue {

  get PageTypes() {
    return PageType;
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

  /**
   * Returns quiz session info object (see type) for current user being marked
   */
  get currentQuizSessionInfoObject(): QuizSessionDataObject | undefined {
    return this.$store.getters.currentQuizSessionInfoObject;
  }

  /**
   * Returns a questionId to question response array map per chat group
   */
  get currentChatGroupResponsesMap() {
    return this.$store.getters.currentChatGroupResponsesMap || [];
  }

  /**
   * Current chat group selected to be marked
   */
  get currentChatGroup() {
    return this.$store.getters.currentChatGroup;
  }

  /**
   * Quiz session id of the user currently being marked
   */
  get currentQuizSessionId() {
    if (!this.currentQuizSessionInfoObject || !this.currentQuizSessionInfoObject.quizSession) return undefined;
    return this.currentQuizSessionInfoObject.quizSession._id;
  }

  /**
   * Current quiz being marked
   */
  get currentQuiz(): IQuiz {
    return this.$store.getters.currentQuiz;
  }


  get pages() {
    return this.currentQuiz.pages || [];
  }

  /** QUESTION LOGIC */

  private getQuestionById(id: string): IQuestion | undefined {
    return this.$store.getters.getQuestionById(id);
  }

  getQuestionResponseForPage(page: IQuestionAnswerPage) {
    if(!this.currentQuizSessionId) return undefined;
    const allResponsesForQuestion: IResponse[] = this.currentChatGroupResponsesMap[page.questionId] || [];
    return allResponsesForQuestion.find((r) => r && r.quizSessionId && r.quizSessionId === this.currentQuizSessionId);
  }

  getQuestionForPage(page: IQuestionAnswerPage) {
    if(!this.currentQuizSessionInfoObject) return undefined;
    return this.getQuestionById(page.questionId);
  }

}
</script>
<style lang="scss" scoped>
@import "../../../css/app.scss";
.marking-collapsible {
  margin: 0.5rem 0;
}
</style>