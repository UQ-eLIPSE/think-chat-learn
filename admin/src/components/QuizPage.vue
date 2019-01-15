<template>
  <div class="container">
    <span>Quiz Title</span><input
      v-model="quizTitle"
      type="text"
    />
    <b-datepicker
      v-model="startDate"
      placeholder="Select the Start Date"
      icon="calendar-today"
    ></b-datepicker>
    <b-timepicker
      v-model="startTime"
      rounded
      placeholder="Select the Start Time"
      icon="clock"
      hour-formart="format"
    ></b-timepicker>
    <b-datepicker
      v-model="endDate"
      placeholder="Select the End Date"
      icon="calendar-today"
    ></b-datepicker>
    <b-timepicker
      v-model="endTime"
      rounded
      placeholder="Select the End Time"
      icon="clock"
      hour-formart="format"
    ></b-timepicker>

    <div
      v-for="(page, index) in pages"
      :key="index"
    >
      <span>Page Title</span><input
        v-model="page.title"
        type="text"
        placeholder="Set the Question Title"
      />
      <span>Page Type</span>
      <select v-model="page.type">
        <option :value="PageType.QUESTION_ANSWER_PAGE">Question Answer Page</option>
        <option :value="PageType.SURVEY_PAGE">Survey Page</option>
        <option :value="PageType.INFO_PAGE">Information Page</option>
        <option :value="PageType.DISCUSSION_PAGE">Discussion Page</option>
      </select>
      <!-- Business logic for rendering based on page type -->
      <!-- TODO make this a proper select box once Questions and Answers are implemented -->
      <select
        v-model="page.questionId"
        v-if="(page.type === PageType.QUESTION_ANSWER_PAGE) || (page.type === PageType.DISCUSSION_PAGE)"
      >
        <option v-for="question in questions" :key="question._id" :value="question._id">{{question.title}}</option>
      </select>
      <select
        v-model="page.surveryId"
        v-else-if="page.type === PageType.SURVEY_PAGE"
      >
        <option> Some Default survey</option>
      </select>

      <span>Page content</span><input
        v-model="page.content"
        type="textarea"
        placeholder="Set the content of the page"
      />
    </div>
    <br>
    <button
      type="button"
      @click="createPage()"
    >Create new page</button>
    <button
      type="button"
      @click="createQuiz()"
    >Create Quiz</button>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
}
</style>
<script lang="ts">

import { Vue, Component, Prop } from "vue-property-decorator";
import { IPage,
    IQuestionAnswerPage, IInfoPage,
    IDiscussionPage, ISurveyPage, IQuiz, Page, TypeQuestion } from "../../../common/interfaces/ToClientData";
import { PageType } from "../../../common/enums/DBEnums";
import { getAdminLoginResponse } from "../../../common/js/front_end_auth";
import { IQuizOverNetwork } from "../../../common/interfaces/NetworkData";

@Component({
})
export default class QuizPage extends Vue {
  // Default values for quizzes
  private quizTitle: string = "";

  @Prop({ default: "" }) private id!: string;


  // The start date in ISO8601. Note that Buefy doesn't really have datetime just date and time unfortunately
  private startDate: Date | null = null;
  private startTime: Date | null = null;
  private endDate: Date | null = null;
  private endTime: Date | null = null;

  // The pages that are wanted to be created. Use
  // a dictionary as we would like to use the temp id
  // instead of index
  private pageDict: {[key: string]: Page} = {};

  // The internal id of pages created. Tossed away when sending
  private mountedId: number = 0;

  // Converts the dictionary to an array based on key number
  get pages() {
    const temp: Page[] = [];

    // Sort the keys then push the elements in order
    Object.keys(this.pageDict).sort((a, b) => {
      return parseInt(a, 10) - parseInt(b, 10);
    }).forEach((element) => {
      temp.push(this.pageDict[parseInt(element, 10)]);
    });

    return temp;
  }

  get PageType() {
    return PageType;
  }

  // Based on the prop id, determines whether or not we are in editing mode
  get isEditing(): boolean {
    return this.id !== "";
  }

  get quizzes(): IQuiz[] {
    return this.$store.getters.quizzes;
  }

  get questions(): TypeQuestion[] {
    return this.$store.getters.questions;
  }

  // Course id based on token
  get courseId() {
    const loginDetails = getAdminLoginResponse();

    return loginDetails ? loginDetails.courseId : "";
  }

  private createQuiz() {
    // For each quiz we have to figure out the type and assign the appropiate types
    // Output pages
    const outgoingPages: Page[] = [];

    // Iterate through each page and strip the appropaite values
    this.pages.forEach((element) => {
      // Note it is possile for unique elements to be stored in the front end
      // but only the relevant data is sent over to the back end
      switch (element.type) {
        case PageType.DISCUSSION_PAGE:
          outgoingPages.push({
            title: element.title,
            content: element.content,
            type: element.type,
            questionId: element.questionId
          });
          break;
        case PageType.INFO_PAGE:
          outgoingPages.push({
            title: element.title,
            content: element.content,
            type: element.type
          });
          break;
        case PageType.QUESTION_ANSWER_PAGE:
          outgoingPages.push({
            title: element.title,
            content: element.content,
            type: element.type,
            questionId: element.questionId
          });
          break;
        case PageType.SURVEY_PAGE:
          outgoingPages.push({
            title: element.title,
            content: element.content,
            type: element.type,
            surveyId: element.surveyId
          });
          break;
      }
    });

    if (!this.startDate || !this.startTime || !this.endDate || !this.endTime) {
      throw Error("Missing start or end datetimes");
    }

    const availableStart = new Date(this.startDate.getFullYear(),
      this.startDate.getMonth(), this.startDate.getDate(),
      this.startTime.getHours(), this.startTime.getMinutes(), this.startTime.getSeconds()).toString();

    const availableEnd = new Date(this.endDate.getFullYear(),
      this.endDate.getMonth(), this.endDate.getDate(),
      this.endTime.getHours(), this.endTime.getMinutes(), this.endTime.getSeconds()).toString();

    const outgoingQuiz: IQuizOverNetwork = {
      title: this.quizTitle,
      availableStart,
      availableEnd,
      pages: outgoingPages,
      course: this.courseId
    };

    if (this.isEditing) {
      outgoingQuiz._id = this.id;
      this.$store.dispatch("updateQuiz", outgoingQuiz);
    } else {
      this.$store.dispatch("createQuiz", outgoingQuiz);
    }


  }

  // The reason for the mounted id is that we need it for rendering purposes
  // but toss it away later for db calls.
  private createPage() {
    const output: IQuestionAnswerPage = {
        type: PageType.QUESTION_ANSWER_PAGE,
        title: "Some Title",
        content: "",
        questionId: ""
    };

    // Remember vue set is need for rendering to occur
    Vue.set(this.pageDict, (this.mountedId++).toString(), output);
  }

  // At least spawn one page at the start or do a load
  private mounted() {
    if (this.id === "") {
      this.createPage();
    } else {
      const loadedQuiz = this.quizzes.find((element) => {
        return element._id === this.id;
      });

      if (!loadedQuiz || !loadedQuiz.pages || !loadedQuiz.title) {
        throw Error("Could not load quiz");
      } else {
        // Load the page values instead
        this.startDate = new Date(loadedQuiz.availableStart!);
        this.startTime = new Date(loadedQuiz.availableStart!);
        this.endDate = new Date(loadedQuiz.availableEnd!);
        this.endTime = new Date(loadedQuiz.availableEnd!);

        this.quizTitle = loadedQuiz.title;

        const emptyDict: {[key: string]: Page} = {};

        // At this point, the loaded quiz and their elemenets should not have null values
        // Remember to use the mounted values as we must be able to mix the loaded
        // values with the non-loaded.
        this.pageDict = loadedQuiz.pages.reduce((dict, element) => {
            dict[(this.mountedId++).toString()] = element;
            return dict;
        }, emptyDict);
      }
    }

  }
}
</script>
