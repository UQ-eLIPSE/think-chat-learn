<template>
    <div class="flex-col question-wrapper">
    <h2>{{ title }}</h2>
    <div class="flex-row">
      <div class="flex-col question-content">
        <div v-html="questionPageContent"></div>
        <div v-html="questionContent"></div>
      </div>
      <div class="flex-col response">
        <h3>Your Response</h3>
        <b-input class="response-content"
          :disabled="true"
          type="textarea"
          v-model="responseWithContents" />

        <div class="confidence flex-row">
          <h3>Confidence: {{confidence}}/5 </h3>
        </div>
      </div>
    </div>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import { Page, IQuestion, IResponse, IQuestionAnswerPage, IResponseQualitative, IResponseMCQ } from "../../../../common/interfaces/DBSchema";
import InfoViewer from "./InfoViewer.vue";
import { QuestionType } from "../../../../common/enums/DBEnums";

@Component({
  components: {
    InfoViewer
  }
})
export default class DiscussionViewer extends Vue {
  @Prop({ default: undefined, required: true }) questionPage!: IQuestionAnswerPage;
  @Prop({ default: undefined, required: true }) question!: IQuestion;
  @Prop({ default: undefined, required: true }) responseWithContent!: IResponse;

  get questionPageContent() {
    return this.questionPage && this.questionPage.content ? this.questionPage.content: '';
  }

  get questionContent() {
    return (this.question && this.question.content) || "";
  }

  get title() {
    return (this.question && this.question.title) || "";
  }

  get responseWithContents() {
    if(!this.responseWithContent || !this.responseWithContent.type) return "";
    switch(this.responseWithContent.type) {
      case QuestionType.QUALITATIVE:
        return (this.responseWithContent as IResponseQualitative).content || "";
      case QuestionType.MCQ:
        // TODO: Once MCQ's are implemented in the system, replace optionId with actual option
        return (this.responseWithContent as IResponseMCQ).optionId || "";
      default:
        return "";
    }
  }

  get confidence() {
    return (this.responseWithContent && this.responseWithContent.confidence) || "";
  }
}
</script>

<style scoped lang="scss">
.content {
    // background-color: #fafafa;
    flex: 0.5;
}

.flex-row {
    display: flex;
}

.flex-col {
    display: flex;
    flex-direction: column;
}

.response-content {
  font-size: 0.8em;
}

.question-content, .response {
  flex: 0.5;
}

.confidence {
  align-items: center;
  >*  { margin: 0.5rem; padding: 0.25rem };
}

</style>