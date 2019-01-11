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
import { Vue, Component } from "vue-property-decorator";
import Confidence from "../components/Confidence.vue";
import { IQuiz, Page, Response, TypeQuestion, IQuizSession } from "../../../common/interfaces/ToClientData";
import { PageType, QuestionType } from "../../../common/enums/DBEnums";

@Component({
  components: {
    Confidence
  }
})
export default class MoocChatPage extends Vue {
  /** Only used when its a question page that is qualitative */
  private responseContent: string = "";
  private confidence: number = 0;

  get PageType() {
    return PageType;
  }

  get QuestionType() {
    return QuestionType;
  }

  get quizSession(): IQuizSession | null {
    return this.$store.getters.quizSession;
  }

  // The idea is based on the quiz and current page,
  // render it appropiately
  get currentIndex(): number {
    return 0;
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

  get question(): TypeQuestion | null {
    if (!this.page || this.page.type !== PageType.QUESTION_ANSWER_PAGE) {
      return null;
    }

    return this.$store.getters.getQuestionById(this.page.questionId);
  }

  private handleConfidenceChange(confidenceValue: number) {
    this.confidence = confidenceValue;
  }

  private sendResponse() {

    // If there is no question, don't run
    if (!this.question || !this.question._id || !this.quiz || !this.quiz._id || !this.quizSession || !this.quizSession._id) {
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

      this.$store.dispatch("sendResponse", response);
    }
    
  }
}
</script>
