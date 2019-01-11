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
            v-model="responseString"
            v-if="question.type === QuestionType.QUALITATIVE"
          >
          </b-input>
          <div v-else-if="QuestionType.MCQ === question.type">
            <p v-for="option in question.options" :key="option._id">
              {{option.content}}
            </p>
          </div>          
        </b-field>
        <Confidence />
        <button class="primary">Submit</button>
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
import { IQuiz, Page } from "../../../common/interfaces/ToClientData";
import { PageType, QuestionType } from "../../../common/enums/DBEnums";

@Component({
  components: {
    Confidence
  }
})
export default class MoocChatPage extends Vue {
  /** Only used when its a question page that is qualitative */
  private responseContent: string = "";

  get PageType() {
    return PageType;
  }

  get QuestionType() {
    return QuestionType;
  }

  // The idea is based on the quiz and current page,
  // render it appropiately
  get currentIndex(): number {
    return 1;
  }

  // If we get an out of bound for the pages, set to null
  get page(): Page | null {
    const quiz = this.$store.getters.quiz;

    if (!quiz) {
      return null
    }

    return this.currentIndex >= quiz.pages.length ? null : quiz.pages[this.currentIndex];
  }

  get question(): TypeQuestion | null {
    if (!this.page || this.page.type !== PageType.QUESTION_ANSWER_PAGE) {
      return null;
    }

    return this.$store.getters.getQuestionById(this.page.questionId);
  }
}
</script>
