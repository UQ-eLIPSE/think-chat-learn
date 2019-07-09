<template>
    <v-container>
      <v-form ref="form">
        <h1 class="moocchat-title">Quiz Editor</h1>
        <v-container fluid grid-list-md>
          <v-layout row wrap>
            <v-flex xs12>
              <b-field label="Set the quiz title">
                <v-text-field label="Title" v-model="quizTitle" outline :rules="[existenceRule]"/>
              </b-field>
            </v-flex>
            <v-flex xs12>
              <!-- In order to create rules, we need to use Vue components instead. Menu with one item is essentially a drop down -->
              <!-- Also v-on syntax is Vue 2.6+ -->
              <b-field label="Select the start date">
                <v-menu
                  ref="startDateMenu"
                  v-model="startDateShow"
                  :close-on-content-click="false"
                  :return-value.sync="startDateString"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field v-model="startDateString" prepend-icon="calendar_today" readonly v-on="on" :rules="[existenceRule]"></v-text-field>
                  </template> 
                  <v-date-picker v-model="startDateString" no-title scrollable>
                    <!-- Use buttons because time pickers require a 2-step process -->
                      <v-spacer></v-spacer>
                      <v-btn flat @click="startDateShow = false">Cancel</v-btn>
                      <v-btn flat @click="$refs.startDateMenu.save(startDateString)">OK</v-btn>                     
                  </v-date-picker>
                </v-menu>
              </b-field>
            </v-flex>
            <v-flex xs12>
              <b-field label="Select a start time">
                <v-menu
                  ref="startTimeMenu"
                  v-model="startTimeShow"
                  :close-on-content-click="false"
                  :return-value.sync="startTimeString"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field v-model="startTimeString" prepend-icon= "access_time" readonly v-on="on" :rules="[existenceRule]">
                    </v-text-field>
                  </template>
                  <v-time-picker v-model="startTimeString" scrollable>
                      <v-btn flat @click="startTimeShow = false">Cancel</v-btn>
                      <v-btn flat @click="$refs.startTimeMenu.save(startTimeString)">OK</v-btn>  
                  </v-time-picker>
                </v-menu>
              </b-field>
            </v-flex>
            <v-flex xs12>
              <b-field label="Select the end date">
                <v-menu
                  ref="endDateMenu"
                  v-model="endDateShow"
                  :close-on-content-click="false"
                  :return-value.sync="endDateString"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field v-model="endDateString" prepend-icon="calendar_today" readonly v-on="on" required :rules="[existenceRule, validDateRule]">
                    </v-text-field>
                  </template> 
                  <v-date-picker v-model="endDateString" no-title scrollable>
                    <v-btn flat @click="endDateShow = false">Cancel</v-btn>
                    <v-btn flat @click="$refs.endDateMenu.save(endDateString)">OK</v-btn>
                  </v-date-picker>
                </v-menu>
              </b-field>
            </v-flex>
            <v-flex xs12>
              <b-field label="Select an end time">
                <v-menu
                  ref="endTimeMenu"
                  v-model="endTimeShow"
                  :close-on-content-click="false"
                  :return-value.sync="endTimeString"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field v-model="endTimeString" prepend-icon= "access_time" readonly v-on="on" :rules="[existenceRule, validDateRule]">
                    </v-text-field>
                  </template> 
                  <v-time-picker v-model="endTimeString" scrollable>
                    <v-btn flat @click="endTimeShow = false">Cancel</v-btn>
                    <v-btn flat @click="$refs.endTimeMenu.save(endTimeString)">OK</v-btn>
                  </v-time-picker>
                </v-menu>
              </b-field>
            </v-flex>
            <!-- Temporary wrapper for the page labels -->
            <v-flex xs12>
              <b-field label="Create and configure the pages"/>
            </v-flex>
            <v-flex v-for="(page, index) in pages"
              class="p"
              :key="index" xs12>
              <b-field label="Set the page title">
                <v-text-field label="Title" v-model="page.title" outline :rules="[existenceRule]"/>
              </b-field>
              <b-field label="Set the page type">
                <!-- Only one rule applys to the discussion page rule -->
                <v-overflow-btn :items="pageTypeDropDown" v-model="page.type" outline :rules="[discussionPageRule]"/>
              </b-field>
              <!-- Business logic for rendering based on page type -->
              <v-checkbox v-if="(page.type === PageType.DISCUSSION_PAGE)" v-model="page.displayResponses" :label="'Display Responses from question?'">
              </v-checkbox>
              <!-- TODO make this a proper select box once Questions and Answers are implemented -->
              <b-field v-if="(page.type === PageType.QUESTION_ANSWER_PAGE) || (page.type === PageType.DISCUSSION_PAGE)"
                label="Set the associate question for the page">
                <v-overflow-btn :items="questionDropDown"
                  v-model="page.questionId" outline 
                  :rules="page.type === PageType.QUESTION_ANSWER_PAGE ? [existenceRule, duplicateQuestionPageRule] : [existenceRule, duplicateDiscussionPageRule]"/>
              </b-field>
              <select v-model="page.surveryId"
                      v-else-if="page.type === PageType.SURVEY_PAGE">
                <option> Some Default survey</option>
              </select>
              <b-field label="Set the content of the page">
                <v-textarea label="Content" v-model="page.content" outline hint="This is content specific to the page rather than the question associated"/>
              </b-field>
              <b-field label="Set the timeout in minutes">
                <v-text-field label="Timeout" v-model="page.timeoutInMins" outline type="number"/>
              </b-field>
              <div class="p-controls">
                <v-btn type="button"
                        @click="up(index)">Move up</v-btn>
                <v-btn type="button"
                        @click="down(index)">Move down</v-btn>
                <v-btn type="button"
                        @click="deletePage(index)">Delete page</v-btn>
              </div>
            </v-flex>
            <v-flex xs12>
              <b-field label="Set the associated Rubric">
                <v-overflow-btn :items="rubricDropDown" v-model="rubricId" outline :rules="[existenceRule]"/>
              </b-field>
            </v-flex>      
            <v-flex xs12>
              <b-field label="Set up the marking configurations"/>
              <v-checkbox v-model="markingConfiguration.allowMultipleMarkers" :label="'Allow multiple markers?'">
              </v-checkbox>
              <label>Max marks: {{ markingConfiguration.maximumMarks }} </label>
            </v-flex>
            <v-flex xs12>
              <v-container class="controls">
                <v-btn type="button"
                        @click="createPage()">Create new page</v-btn>
                <v-btn type="button"
                        @click="createQuiz()">Create/ update Quiz</v-btn>
              </v-container>
            </v-flex>
          </v-layout>
        </v-container>
      </v-form>
  </v-container>
</template>

<style scoped>
.container {
  width: 100%;
}
</style>
<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import {
  IPage,
  IQuestionAnswerPage,
  IInfoPage,
  IDiscussionPage,
  ISurveyPage,
  IQuiz,
  Page,
  TypeQuestion,
  IRubric
} from "../../../common/interfaces/ToClientData";
import { PageType } from "../../../common/enums/DBEnums";
import * as DBSchema from "../../../common/interfaces/DBSchema";
import { getAdminLoginResponse } from "../../../common/js/front_end_auth";
import { IQuizOverNetwork } from "../../../common/interfaces/NetworkData";
import { EventBus, EventList, SnackEvent } from "../EventBus";
import { Utils } from "../../../common/js/Utils";
interface DropDownConfiguration {
  text: string,
  value: string,
}

@Component({})
export default class QuizPage extends Vue {
  // Default values for quizzes
  private quizTitle: string = "";

  @Prop({ default: "" }) private id!: string;

  // The dates and time in ISO8601. To compute the time we use the current date and only look at time
  private startDate: Date | null = null;
  // The string versions are required to interact with the datepicker
  private startDateString: string = "";
  private startTime: Date | null = null;
  private startTimeString: string = "";
  private endDate: Date | null = null;
  private endDateString: string = "";
  private endTime: Date | null = null;
  private endTimeString: string = "";

  private test: any = {};
  private rubricId: string = "";

  private markingConfiguration: DBSchema.MarkConfig = this.initMarkConfig();
  // The pages that are wanted to be created. Use
  // a dictionary as we would like to use the temp id
  // instead of index
  private pageDict: { [key: string]: Page } = {};

  // The internal id of pages created. Tossed away when sending
  private mountedId: number = 0;

  // The default configurations of the dropdown menu for interfaces
  private pageTypeDropDown: DropDownConfiguration[] = [
    {
      text: 'Question Answer Page',
      value: PageType.QUESTION_ANSWER_PAGE
    },
    {
      text: 'Information Page',
      value: PageType.INFO_PAGE
    },
    {
      text: 'Survey Page',
      value: PageType.SURVEY_PAGE
    },
    {
      text: 'Discussion Page',
      value: PageType.DISCUSSION_PAGE
    },    
  ]

  // Menu booleans
  private startDateShow: boolean = false;
  private endDateShow: boolean = false;
  private startTimeShow: boolean = false;
  private endTimeShow: boolean = false;


  initMarkConfig(): DBSchema.MarkConfig {
    return {
      allowMultipleMarkers: false,
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

  // Generates the configuration of the question dropdown. Just need id as value and title as display
  get questionDropDown(): DropDownConfiguration[] {
    // Question should be defined at this point
    return this.questions.map((question) => {
      return {
        text: question.title ? question.title : "",
        value: question._id ? question._id : ""
      };
    });
  }

  // Course id based on token
  get courseId() {
    const loginDetails = getAdminLoginResponse();

    return loginDetails ? loginDetails.courseId : "";
  }

  get rubricDropDown(): DropDownConfiguration[] {
    return this.rubrics.map((rubric) => {
      return {
        text: rubric.name ? rubric.name : "",
        value: rubric._id ? rubric._id : ""
      };
    });
  }

  get rubrics(): IRubric[] {
    return this.$store.getters.rubrics;
  }

  private createQuiz() {
    // Check for the rules note that the $refs aren't defined with Vuetify
    const valid = (this.$refs.form as any).validate();

    if (!valid) {
        const message: SnackEvent = {
            message: "Failed generate quiz. Check the form for any errors",
            error: true
        }
        EventBus.$emit(EventList.PUSH_SNACKBAR, message);
        return;
    }

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
      rubricId: this.rubricId
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

        // Assuming the date comes from ISO8601 we need to strip the string in this manner
        this.startDateString = this.startDate ? this.startDate.toISOString().substr(0, 10) : "";
        this.endDateString = this.endDate ? this.endDate.toISOString().substr(0, 10) : "";
        // Padding isn't necessary but for visualisation purposes it is
        this.startTimeString = this.startTime ? `${this.startTime.getHours()}`.padStart(2, "0") + ":" + `${this.startTime.getMinutes()}`.padStart(2, "0") : "";
        this.endTimeString = this.endTime ? `${this.endTime.getHours()}`.padStart(2, "0") + ":" + `${this.endTime.getMinutes()}`.padStart(2, "0") : "";

        this.quizTitle = loadedQuiz.title;
        this.rubricId = loadedQuiz.rubricId!;
        this.markingConfiguration = loadedQuiz.markingConfiguration || this.markingConfiguration;
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

  @Watch("startDateString")
  private onStartDateChange(val: string, oldVal?: string) {
    this.startDate = new Date(val);
  }

  @Watch("endDateString")
  private onEndDateChange(val: string, oldVal?: string) {
    this.endDate = new Date(val);
  }
  
  // Watching the start time is generally done when a user touches the Vuetify timepicker
  @Watch("startTimeString")
  private onStartTimeChange(val: string, oldVal?: string) {
    this.startTime = new Date();
    // Vuetify times are assumed to be in a HH:MM format
    const hourMinutes = val.split(":");
    this.startTime.setHours(parseInt(hourMinutes[0]), parseInt(hourMinutes[1]));
  }
  
  // Similar logic above
  @Watch("endTimeString")
  private onEndTimeChange(val: string, oldVal?: string) {
    this.endTime = new Date();
    const hourMinutes = val.split(":");
    this.endTime.setHours(parseInt(hourMinutes[0]), parseInt(hourMinutes[1]));    
  }  

  /**
   * Below is a list of rules that should be validated both front and back end
   */

  // Determines whether or not a quiz has a discussion page
  get discussionPageRule() {
    return (() => { 
      const hasDiscussion = this.pages.some((page) => {
        return page.type === PageType.DISCUSSION_PAGE;
      });
      return hasDiscussion || "No dicussion page found, should have one present in the quiz";
    });
  }

  // Compares the start and end date values and existence
  get validDateRule() {
    return (() => {
      if (this.startDate && this.startTime && this.endDate && this.endTime) {
        // Construct the time and check for comparisons since we have valid inputs
        const availableStart = new Date(
          this.startDate.getFullYear(),
          this.startDate.getMonth(),
          this.startDate.getDate(),
          this.startTime.getHours(),
          this.startTime.getMinutes(),
          this.startTime.getSeconds()
        );

        const availableEnd = new Date(
          this.endDate.getFullYear(),
          this.endDate.getMonth(),
          this.endDate.getDate(),
          this.endTime.getHours(),
          this.endTime.getMinutes(),
          this.endTime.getSeconds()
        );
        return availableEnd.getTime() > availableStart.getTime() || "Set the end time to be greater than start time";
      } else {
        return "Start Date and End Date needs to be filled out"
      }
    });
  }

  get existenceRule() {
    return Utils.Rules.existenceRule;
  }

  get duplicateQuestionPageRule() {
    return ((id: string) => {
        const totalIds = this.pages.reduce((count: number, page) => {
            if (page.type === PageType.QUESTION_ANSWER_PAGE && page.questionId === id) {
                count = count + 1;
            }
            return count;
        }, 0);
        return totalIds == 1 || "Duplicate questions detected";            
    });
  }

  get duplicateDiscussionPageRule() {
    return ((id: string) => {
        const totalIds = this.pages.reduce((count: number, page) => {
            if (page.type === PageType.DISCUSSION_PAGE && page.questionId === id) {
                count = count + 1;
            }
            return count;
        }, 0);
        return totalIds == 1 || "Duplicate discussions detected";            
    });
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

.moocchat-title {
  margin: 6px;
}
</style>
