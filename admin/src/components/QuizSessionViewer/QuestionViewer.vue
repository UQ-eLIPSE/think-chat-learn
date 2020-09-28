<template>
  <div class="flex-col question-wrapper">
    <h2>{{ title }}</h2>

    <button
      type="button"
      class="button-min toggle-question button-cs"
      @click.prevent="questionContentVisible = !questionContentVisible"
    >
      <span>{{ questionContentVisible? 'Hide question': 'Show question' }}</span>
      <div class="circular-icon">
          <i
            :class="questionContentVisible? 'icon-chevron-left':'icon-chevron-right'"
            title="Toggle Question"
          />
        </div>
        
    </button>

    <div
      class="flex-row justify-space-between"
      :class="{ 'content-invisible': !questionContentVisible }"
    >
      <div class="flex-col question-content" v-show="questionContentVisible">
        <div v-html="questionPageContent"></div>
        <div v-html="questionContent"></div>
      </div>

      <div class="flex-col response">
        <h3>Response</h3>
        <b-input
          class="response-content"
          :disabled="true"
          type="textarea"
          v-model="responseWithContents"
        />

        <div class="confidence flex-row">
          <h3>Confidence: {{confidence}}/5</h3>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import {
  Page,
  IQuestion,
  IResponse,
  IQuestionAnswerPage,
  IResponseQualitative,
  IResponseMCQ,
} from "../../../../common/interfaces/DBSchema";
import { QuestionType } from "../../../../common/enums/DBEnums";

@Component
export default class QuestionViewer extends Vue {
  @Prop({ default: undefined, required: true })
  questionPage!: IQuestionAnswerPage;
  @Prop({ default: undefined, required: true }) question!: IQuestion;
  @Prop({ default: undefined, required: true }) responseWithContent!: IResponse;

  /**
   * Controls if question content is visible
   * Will not be displayed by default
   */
  questionContentVisible: boolean = false;

  get questionPageContent() {
    return this.questionPage && this.questionPage.content
      ? this.questionPage.content
      : "";
  }

  get questionContent() {
    return (this.question && this.question.content) || "";
  }

  get title() {
    return (this.question && this.question.title) || "";
  }

  get responseWithContents() {
    if (!this.responseWithContent || !this.responseWithContent.type) return "";
    switch (this.responseWithContent.type) {
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
    return (
      (this.responseWithContent && this.responseWithContent.confidence) || ""
    );
  }
}
</script>

<style scoped lang="scss">
@import "../../../css/partial/variables.scss";
.content {
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

.question-content {
  max-height: 450px;
  overflow: scroll;
}

.response {
  @media screen and (max-width: 768px) {
    width: 100%;
  }
}

.question-content,
.response {
  flex: 0.5;
  margin: 1rem;
  @media screen and (max-width: 768px) {
    flex: unset;
  }
}

.content-invisible {
  .response {
    flex: 1;
  }

  .question-content {
    flex: 0.1;
  }
}

.question-close {
  cursor: pointer;
}

.confidence {
  align-items: center;
  > * {
    margin: 0.5rem;
    padding: 0.25rem;
  }
}

.toggle-question {
  display: flex;
  align-items: center;
  padding-left: 0;
  font-size: 0.7em;
  text-transform: uppercase;
  color: $primary;
  font-weight: bold;

  &:active, &:focus, &:hover {
    outline: none;
  }
}
</style>