<template>
  <div class="c">
    <span>Quiz Title</span><input v-model="quizTitle"
           type="text" />
    <b-datepicker v-model="startDate"
                  placeholder="Select the Start Date"
                  icon="calendar-today"></b-datepicker>
    <b-timepicker v-model="startTime"
                  rounded
                  placeholder="Select the Start Time"
                  icon="clock"
                  hour-formart="format"></b-timepicker>
    <b-datepicker v-model="endDate"
                  placeholder="Select the End Date"
                  icon="calendar-today"></b-datepicker>
    <b-timepicker v-model="endTime"
                  rounded
                  placeholder="Select the End Time"
                  icon="clock"
                  hour-formart="format"></b-timepicker>
    <div>
      <span>Group Size</span>
      <input type="number"
             v-model.number="groupSize" />      
    </div>
    <div v-for="(page, index) in pages"
         class="p"
         :key="index">
      <span>Page Title</span><input v-model="page.title"
             type="text"
             placeholder="Set the Question Title" />
      <span>Page Type</span>
      <select v-model="page.type">
        <option :value="PageType.QUESTION_ANSWER_PAGE">Question Answer Page</option>
        <option :value="PageType.SURVEY_PAGE">Survey Page</option>
        <option :value="PageType.INFO_PAGE">Information Page</option>
        <option :value="PageType.DISCUSSION_PAGE">Discussion Page</option>
      </select>
      <!-- Business logic for rendering based on page type -->
      <label v-if="(page.type === PageType.DISCUSSION_PAGE)">
        Display responses from question?
        <input type="checkbox"
               v-model="page.displayResponses" /> </label>
      <!-- TODO make this a proper select box once Questions and Answers are implemented -->

      <select v-model="page.questionId"
              v-if="(page.type === PageType.QUESTION_ANSWER_PAGE) || (page.type === PageType.DISCUSSION_PAGE)">
        <option v-for="question in questions"
                :key="question._id"
                :value="question._id">{{question.title}}</option>
      </select>

      <select v-model="page.surveryId"
              v-else-if="page.type === PageType.SURVEY_PAGE">
        <option> Some Default survey</option>
      </select>

      <span>Page content</span>
      <textarea v-model="page.content"
                placeholder="Set the content of the page" />
      <span>Timeout time</span>
      <input type="number"
             v-model.number="page.timeoutInMins" />
      <div class="p-controls">
        <button type="button"
                @click="up(index)">Move up</button>
        <button type="button"
                @click="down(index)">Move down</button>
        <button type="button"
                @click="deletePage(index)">Delete page</button>
      </div>
    </div>

    <div class="marking-config">
      <label> Marking Configuration
      <select v-model="markingConfiguration">
        <option v-for="m in [elipssMarkConfig, simpleMarkConfig]"
                :value="m"
                :key="m.type">{{ m.type }}</option>
      </select>
      </label>
      <label>Allow multiple markers? <input type="checkbox"
               v-model="markingConfiguration.allowMultipleMarkers" /></label>
      <label>Max marks: {{ markingConfiguration.maximumMarks }} </label>
    </div>
    <div class="controls">
      <button type="button"
              @click="createPage()">Create new page</button>
      <button type="button"
              @click="createQuiz">Create/ update Quiz</button>
    </div>

  </div>
</template>

<style scoped>
.container {
  width: 100%;
}
</style>
<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import {
  IPage,
  IQuestionAnswerPage,
  IInfoPage,
  IDiscussionPage,
  ISurveyPage,
  IQuiz,
  Page,
  TypeQuestion
} from "../../../common/interfaces/ToClientData";
import { PageType } from "../../../common/enums/DBEnums";
import * as DBSchema from "../../../common/interfaces/DBSchema";
import { getAdminLoginResponse } from "../../../common/js/front_end_auth";
import { IQuizOverNetwork } from "../../../common/interfaces/NetworkData";
import { Conf } from "../../../common/config/Conf";
@Component({})
export default class QuizPage extends Vue {
  // Default values for quizzes
  private quizTitle: string = "";

  @Prop({ default: "" }) private id!: string;

  // The start date in ISO8601. Note that Buefy doesn't really have datetime just date and time unfortunately
  private startDate: Date | null = null;
  private startTime: Date | null = null;
  private endDate: Date | null = null;
  private endTime: Date | null = null;

  private simpleMarkConfig: DBSchema.SimpleMarkConfig = this.initSimpleMarkConfig();
  private elipssMarkConfig: DBSchema.ElipssMarkConfig = this.initElipssMarkConfig();

  private groupSize: number = Conf.groups.defaultGroupSize;

  private markingConfiguration: DBSchema.MarkingConfiguration | undefined = this.elipssMarkConfig;
  // The pages that are wanted to be created. Use
  // a dictionary as we would like to use the temp id
  // instead of index
  private pageDict: { [key: string]: Page } = {};

  // The internal id of pages created. Tossed away when sending
  private mountedId: number = 0;


  get markModes() {
    return Object.keys(DBSchema.MarkMode);
  }

  initSimpleMarkConfig(): DBSchema.SimpleMarkConfig {
    return {
      type: DBSchema.MarkMode.SIMPLE_MARKING,
      allowMultipleMarkers: false,
      maximumMarks: 5
    }
  }

  initElipssMarkConfig(): DBSchema.ElipssMarkConfig {
    return {
      type: DBSchema.MarkMode.ELIPSS_MARKING,
      allowMultipleMarkers: true,
      maximumMarks: 5
    }
  }

  // Converts the dictionary to an array based on key number
  get pages() {
    const temp: Page[] = [];

    // Sort the keys then push the elements in order
    Object.keys(this.pageDict)
      .sort((a, b) => {
        return parseInt(a, 10) - parseInt(b, 10);
      })
      .forEach(element => {
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

  createQuiz() {
    // For each quiz we have to figure out the type and assign the appropiate types
    // Output pages
    const outgoingPages: Page[] = [];

    // Iterate through each page and strip the appropaite values
    this.pages.forEach(element => {
      // Note it is possile for unique elements to be stored in the front end
      // but only the relevant data is sent over to the back end
      switch (element.type) {
        case PageType.DISCUSSION_PAGE:
          outgoingPages.push({
            title: element.title,
            content: element.content,
            type: element.type,
            questionId: element.questionId,
            timeoutInMins: element.timeoutInMins,
            displayResponses: element.displayResponses
          });
          break;
        case PageType.INFO_PAGE:
          outgoingPages.push({
            title: element.title,
            content: element.content,
            type: element.type,
            timeoutInMins: element.timeoutInMins
          });
          break;
        case PageType.QUESTION_ANSWER_PAGE:
          outgoingPages.push({
            title: element.title,
            content: element.content,
            type: element.type,
            questionId: element.questionId,
            timeoutInMins: element.timeoutInMins
          });
          break;
        case PageType.SURVEY_PAGE:
          outgoingPages.push({
            title: element.title,
            content: element.content,
            type: element.type,
            surveyId: element.surveyId,
            timeoutInMins: element.timeoutInMins
          });
          break;
      }
    });

    if (!this.startDate || !this.startTime || !this.endDate || !this.endTime) {
      throw Error("Missing start or end datetimes");
    }

    const availableStart = new Date(
      this.startDate.getFullYear(),
      this.startDate.getMonth(),
      this.startDate.getDate(),
      this.startTime.getHours(),
      this.startTime.getMinutes(),
      this.startTime.getSeconds()
    ).toString();

    const availableEnd = new Date(
      this.endDate.getFullYear(),
      this.endDate.getMonth(),
      this.endDate.getDate(),
      this.endTime.getHours(),
      this.endTime.getMinutes(),
      this.endTime.getSeconds()
    ).toString();

    const outgoingQuiz: IQuizOverNetwork = {
      title: this.quizTitle,
      availableStart,
      availableEnd,
      pages: outgoingPages,
      course: this.courseId,
      markingConfiguration: this.markingConfiguration,
      groupSize: this.groupSize
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
      questionId: "",
      timeoutInMins: 2
    };

    // Remember vue set is need for rendering to occur
    Vue.set(this.pageDict, (this.mountedId++).toString(), output);
  }

  private deletePage(index: number) {

    Vue.delete(this.pageDict, index);

  }

  private up(index: number) {

    if (this.pageDict[index]) {
      if (index === 0) return;
      const temp = JSON.parse(JSON.stringify(this.pageDict[index]));
      this.pageDict[index] = this.pageDict[index - 1];
      this.pageDict[index - 1] = JSON.parse(JSON.stringify(temp));
    }

  }

  private down(index: number) {
    if (this.pageDict[index]) {
      if (index === this.pages.length - 1) return;
      const temp = JSON.parse(JSON.stringify(this.pageDict[index]));
      this.pageDict[index] = this.pageDict[index + 1];
      this.pageDict[index + 1] = JSON.parse(JSON.stringify(temp));
    }

  }

  // At least spawn one page at the start or do a load
  private mounted() {
    if (this.id === "") {
      this.createPage();
    } else {
      const loadedQuiz = this.quizzes.find(element => {
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
        this.groupSize = loadedQuiz.groupSize;
        this.quizTitle = loadedQuiz.title;
        this.markingConfiguration = loadedQuiz.markingConfiguration || this.elipssMarkConfig;
        const emptyDict: { [key: string]: Page } = {};

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

<style scoped lang="css">
.p {
  display: flex;
  flex-direction: column;
  border: 0.1rem solid rgba(1, 0, 0, 0.2);
  padding: 0.5rem;
  margin: 0.5rem;
  overflow: auto;
  flex-shrink: 0;
  width: 80%;
  background: rgb(200, 200, 200);
  align-self: center;
}

.c {
  display: flex;
  flex-direction: column;
  overflow: auto;
  flex-shrink: 0;
  width: calc(100% - 18rem);
}

.controls {
  padding: 1rem;
}

.p-controls {
  display: flex;
  padding: 1rem;
  flex-shrink: 0;
}

.p-controls>* {
  margin: 0.25rem;
}


.marking-config {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  border: 0.1rem solid rgba(1, 0, 0, 0.2);
  align-self: center;
}
</style>
