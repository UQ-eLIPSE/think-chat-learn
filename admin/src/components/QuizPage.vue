<template>
  <v-container>
    <v-form ref="form">
      <h1 class="moocchat-title">{{ pageTitle }}</h1>
      <h3 v-if="isCloning">
        Values have been pre-filled using the data from quiz session "{{ clonedQuizName }}".
        You can change these values as desired for the new quiz session (E.g. Start and end time, quiz title)
      </h3>
      <v-container fluid grid-list-md>
        <v-layout row wrap>
          <v-flex xs12>
            <h3>Quiz details</h3>
          </v-flex>
          
          <v-flex class="form-control" xs12>
            <Validator :validationRule="[existenceRule]" :value="quizTitle" :forceShowValidation="forceValidation">
              <span class="input-label required-input">Set the quiz title</span>
              <div class="editable-field">
                <input type="text" v-model="quizTitle"/>
              </div>
            </Validator>
          </v-flex>

          <v-flex class="form-control" xs5>
            <Validator :validationRule="[existenceRule]" :value="rubricId" :forceShowValidation="forceValidation">
              <span class="input-label required-input">Rubric</span>
              <div class="select-field">
                <select v-model="rubricId">
                  <template v-for="rubric in rubricDropDown">
                    <option :key="`rubric-${rubric.value}`" :value="rubric.value">{{rubric.text}}</option>
                  </template>
                </select>
              </div>
            </Validator>
          </v-flex>

          <v-flex class="form-control" xs2>
            <Validator :validationRule="[existenceRule]" :value="groupSize" :forceShowValidation="forceValidation">
              <span class="input-label required-input">Group size</span>
              <div class="editable-field">
                <input type="number" v-model.number="groupSize"/>
              </div>
            </Validator>
          </v-flex>

          <v-flex xs1>
            <div class="divider vertical-divider"></div>
          </v-flex>

          <v-flex class="form-control" xs4>
            <span class="input-label">Marking Configuration</span>
            <div class="card-container ma-0" :style="{padding: '12px 16px'}">
              <v-layout row class="align-center">
                <input type="checkbox" v-model="markingConfiguration.allowMultipleMarkers" class="mr-2">
                <span class="checkbox-label">Allow multiple markers</span>
              </v-layout>
            </div>
          </v-flex>

          <v-flex xs12>
            <div class="divider"></div>
          </v-flex>
          
          <v-flex xs12>
            <h3>Schedule details</h3>
          </v-flex>
          
          <v-flex xs3>
            <!-- In order to create rules, we need to use Vue components instead. Menu with one item is essentially a drop down -->
            <!-- Also v-on syntax is Vue 2.6+ -->
            <span class="input-label required-input">Start date</span>
            <v-menu
              ref="startDateMenu"
              v-model="startDateShow"
              :close-on-content-click="false"
              :return-value.sync="startDateString"
              min-width="unset"
            >
              <template v-slot:activator="{ on }">
                <div class="form-control date-field">
                  <Validator :validationRule="[existenceRule, validDateRule('startDateTime')]" :value="startDateString" 
                             :forceShowValidation="forceValidation">
                    <input type="text" v-model="startDateString" v-on="on" readonly/>
                  </Validator>
                </div>
              </template>
              <v-date-picker v-model="startDateString" no-title scrollable :max="endDateString">
                <!-- Use buttons because time pickers require a 2-step process -->
                <v-spacer></v-spacer>
                <v-btn flat @click="startDateShow = false">Cancel</v-btn>
                <v-btn flat @click="$refs.startDateMenu.save(startDateString)">OK</v-btn>
              </v-date-picker>
            </v-menu>
          </v-flex>


          <v-flex xs3>
            <span class="input-label required-input">Start time</span>
            <v-menu
              ref="startTimeMenu"
              v-model="startTimeShow"
              :close-on-content-click="false"
              :return-value.sync="startTimeString"
              min-width="unset"
            >
              <template v-slot:activator="{ on }">
                <div class="form-control time-field">
                  <Validator :validationRule="[existenceRule, validDateRule('startDateTime')]" :value="startTimeString"
                             :forceShowValidation="forceValidation">
                    <input type="text" v-model="startTimeString" v-on="on" readonly/>
                  </Validator>
                </div>
              </template>
              <v-time-picker v-model="startTimeString" scrollable format="24hr" 
                             :max="endDateString === startDateString? endTimeString: ''">
                <v-btn flat @click="startTimeShow = false">Cancel</v-btn>
                <v-btn flat @click="$refs.startTimeMenu.save(startTimeString)">OK</v-btn>
              </v-time-picker>
            </v-menu>
          </v-flex>


          <v-flex xs3>
            <span class="input-label required-input">End date</span>
            <v-menu
              ref="endDateMenu"
              v-model="endDateShow"
              :close-on-content-click="false"
              :return-value.sync="endDateString"
              min-width="unset"
            >
              <template v-slot:activator="{ on }">
                <div class="form-control date-field">
                  <Validator :validationRule="[existenceRule, validDateRule('endDateTime')]" :value="endDateString"
                             :forceShowValidation="forceValidation">
                    <input type="text" v-model="endDateString" v-on="on" readonly/>
                  </Validator>
                </div>
              </template>
              <v-date-picker v-model="endDateString" no-title scrollable :min="startDateString">
                <v-btn flat @click="endDateShow = false">Cancel</v-btn>
                <v-btn flat @click="$refs.endDateMenu.save(endDateString)">OK</v-btn>
              </v-date-picker>
            </v-menu>
          </v-flex>

          <v-flex xs3>
            <span class="input-label required-input">End time</span>
            <v-menu
              ref="endTimeMenu"
              v-model="endTimeShow"
              :close-on-content-click="false"
              :return-value.sync="endTimeString"
              min-width="unset"
            >
              <template v-slot:activator="{ on }">
                <div class="form-control time-field">
                  <Validator :validationRule="[existenceRule, validDateRule('endDateTime')]" :value="endTimeString"
                             :forceShowValidation="forceValidation">
                    <input type="text" v-model="endTimeString" v-on="on" readonly/>
                  </Validator>
                </div>
              </template>
              <v-time-picker v-model="endTimeString" scrollable format="24hr"
                             :min="endDateString === startDateString? startTimeString: ''">
                <v-btn flat @click="endTimeShow = false">Cancel</v-btn>
                <v-btn flat @click="$refs.endTimeMenu.save(endTimeString)">OK</v-btn>
              </v-time-picker>
            </v-menu>
          </v-flex>

          <v-flex xs12>
            <div class="form-control">
              <v-layout row class="align-center my-2">
                <input type="checkbox" v-model="isPublic"/>
                <span class="checkbox-label ml-2">Public? (If checked, this quiz will be displayed to students)</span>
              </v-layout>
            </div>
          </v-flex>

          <v-flex xs12>
            <div class="divider"></div>
          </v-flex>

          <!-- Temporary wrapper for the page labels -->
          <v-flex xs12>
            <h3>Quiz content</h3>
          </v-flex>

          <v-flex v-for="(page, index) in pages" :key="page.__mountedId" xs12>
            <v-layout row class="align-start mt-3">

              <div class="page-elevation-controls mr-1">
                <button type="button" @click="up(index)"
                        :class="`squircular-icon ${index === 0? 'move-btn-disabled': 'move-btn'}`" >
                  <i class="icon-chevron-up"></i>
                </button>
                
                <button type="button"  @click="down(index)"
                        :class="`squircular-icon ${index === pages.length - 1? 'move-btn-disabled': 'move-btn'}`">
                  <i class="icon-chevron-down"></i>
                </button>
              </div>

              <v-flex class="position-relative" xs11>
                <Collapsible class="marking-collapsible" :title="`Page #${index + 1} - ${page.title || ''}`">
                  <v-layout row wrap class="mt-3 pa-3">
                    <v-flex xs12>
                      <Validator :validationRule="[existenceRule, validDateRule('endDateTime')]" :value="endDateString"
                                :forceShowValidation="forceValidation">
                        <input type="text" v-model="endDateString" v-on="on" readonly/>
                      </Validator>
                    </v-flex>
                    <v-flex xs5 class="form-control">
                      <span class="input-label required-input">Page title</span>
                      <div class="editable-field">
                        <input type="text" v-model="page.title"/>
                      </div>
                    </v-flex>

                    <v-flex xs4 class="form-control">
                      <span class="input-label required-input">Page type</span>
                      <div class="select-field">
                        <select v-model="page.type">
                          <template v-for="pageType in pageTypeDropDown">
                            <option :key="`pt-${pageType.value}`" :value="pageType.value">{{pageType.text}}</option>
                          </template>
                        </select>
                      </div>
                    </v-flex>

                    <v-flex xs3 class="form-control">
                      <span class="input-label required-input">Timeout (minutes)</span>
                      <div class="editable-field">
                        <input type="number" v-model="page.timeoutInMins"/>
                      </div>
                    </v-flex>
                      
                    <v-flex xs6 class="form-control">
                      <!-- TODO make this a proper select box once Questions and Answers are implemented -->
                      <div v-if="(page.type === PageType.QUESTION_ANSWER_PAGE) || (page.type === PageType.DISCUSSION_PAGE)">
                        <Validator :validationRule="page.type === PageType.QUESTION_ANSWER_PAGE ? 
                                                    [existenceRule, duplicateQuestionPageRule] 
                                                    : [existenceRule, duplicateDiscussionPageRule]"
                                   :value="page.questionId"
                                   :forceShowValidation="forceValidation">
                          <span class="input-label required-input">Associate question for the page</span>
                          <div class="select-field">
                            <select v-model="page.questionId">
                              <template v-for="question in questionDropDown">
                                <option :key="`pt-${question.value}`" :value="question.value">{{question.text}}</option>
                              </template>
                            </select>
                          </div>
                        </Validator>
                      </div>
                      
                      <div class="select-field" v-else-if="page.type === PageType.SURVEY_PAGE">
                        <select v-model="page.surveryId">
                          <option>Some Default survey</option>
                        </select>
                      </div>
                    </v-flex>
                  
                    <!-- Business logic for rendering based on page type -->
                    <v-flex xs1 v-if="(page.type === PageType.DISCUSSION_PAGE)">
                      <div class="divider vertical-divider"></div>
                    </v-flex>

                    <v-flex xs5 class="form-control" v-if="(page.type === PageType.DISCUSSION_PAGE)">
                      <v-layout row class="align-center mt-3 py-2">
                        <input type="checkbox" v-model="page.displayResponses"/>
                        <span class="checkbox-label ml-2">Display responses from question</span>
                      </v-layout>
                    </v-flex>
                  </v-layout>

                  <v-flex xs12 class="pa-3">
                    <span class="input-label required-input">Page content</span>
                    <TinyMce :id="`tmce-${page.__mountedId}`" v-model="page.content" />
                  </v-flex>
                </Collapsible>

                <div class="page-multipliable-controls">
                  <button type="button" class="button-cs dark-grey-cl delete-btn compact-btn" @click="deletePage(index)">
                    <i class="icon-times-circle"></i>
                    Delete Page
                  </button>
                  <button type="button" class="button-cs green-cl add-btn compact-btn" @click="createPage(index + 1)">
                    <i class="icon-plus-circle"></i>
                    New Page
                  </button>
                </div>
              </v-flex>
            </v-layout>

          </v-flex>
          
          <v-flex xs12>
            <v-container class="controls">
              <button type="button" class="primary-cl button-cs" @click="submitQuiz()">{{ pageAction }}</button>
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
import TinyMce from "./TinyMce.vue";
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
import { Conf } from "../../../common/config/Conf";
import { showSnackbar } from "../EventBus";
import { Utils } from "../../../common/js/Utils";
import API from "../../../common/js/DB_API";
import uniqueId from "../util/uniqueId";
import { saveTinyMceEditorContent } from "../util/TinyMceUtils";
import Validator from "../elements/Validator.vue";
import Collapsible from "../elements/Collapsible.vue"


interface DropDownConfiguration {
  text: string;
  value: string;
}

const IMAGE_LOCATION = process.env.VUE_APP_IMAGE_LOCATION;

@Component({
  components: {
    TinyMce,
    Validator,
    Collapsible
  }
})
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

  private groupSize: number = Conf.groups.defaultGroupSize;
  private markingConfiguration: DBSchema.MarkConfig = this.initMarkConfig();
  
  /**
   * If true, students will be able to view this quiz. Otherwise, it will be displayed only to course staff members
   */
  private isPublic: boolean = true;

  private pagesArray: (Page & { __mountedId?: string })[] = [];


  // The default configurations of the dropdown menu for interfaces
  private pageTypeDropDown: DropDownConfiguration[] = [
    {
      text: "Question Answer Page",
      value: PageType.QUESTION_ANSWER_PAGE
    },
    {
      text: "Information Page",
      value: PageType.INFO_PAGE
    },
    {
      text: "Discussion Page",
      value: PageType.DISCUSSION_PAGE
    }
  ];

  // Menu booleans
  private startDateShow: boolean = false;
  private endDateShow: boolean = false;
  private startTimeShow: boolean = false;
  private endTimeShow: boolean = false;

  private quizToBeCloned: null | DBSchema.IQuiz = null;

  private forceValidation: boolean = false;

  initMarkConfig(): DBSchema.MarkConfig {
    return {
      allowMultipleMarkers: false,
      maximumMarks: 5
    };
  }

  // Converts the dictionary to an array based on key number
  get pages() {
    return this.pagesArray;
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
    return this.questions.map(question => {
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
    return this.rubrics.map(rubric => {
      return {
        text: rubric.name ? rubric.name : "",
        value: rubric._id ? rubric._id : ""
      };
    });
  }

  get rubrics(): IRubric[] {
    return this.$store.getters.rubrics;
  }

  get numPages(): number {
    return this.pagesArray.length;
  }

  private async submitQuiz() {
    // Check for the rules note that the $refs aren't defined with Vuetify
    const valid = (this.$refs.form as any).validate();

    const nonEmptyFieldArray = [this.quizTitle, this.rubricId, this.groupSize, 
                                  this.startDateString, this.startTimeString, this.endDateString, this.endTimeString];
    const allFieldsFilled = 
          nonEmptyFieldArray.every((field) => this.existenceRule(field) && typeof this.existenceRule(field) === 'boolean')
          && this.pages.every((page) => 
                        [page.type, page.title].every((field) => this.existenceRule(field) && typeof this.existenceRule(field) === 'boolean')
                        //If page type is question or discussion, check if associated question is chosen
                        && (page.type !== PageType.INFO_PAGE 
                            && this.existenceRule(page['questionId']) && typeof this.existenceRule(page['questionId']) === 'boolean')); 
    
    if(!allFieldsFilled){
      this.forceValidation = true;
      showSnackbar("Some required fields are not filled", true);
      return;
    }

    const startDateValidate = this.validDateRule('startDateTime')();
    const endDateValidate = this.validDateRule('endDateTime')();
    const validDateTime = startDateValidate && (typeof startDateValidate === 'boolean')
                          && endDateValidate && (typeof endDateValidate === 'boolean')

    if(!validDateTime){
      this.forceValidation = true;
      showSnackbar("Invalid schedule time", true);
      return;
    }

    //Validate quiz content
    const questionSet = new Set();
    const quizContentValid = this.pages.every((page) => {
      switch (page.type){
        case PageType.QUESTION_ANSWER_PAGE:
          questionSet.add(page.questionId);
          return this.duplicateQuestionPageRule(page.questionId) 
                 && typeof this.duplicateQuestionPageRule(page.questionId) === 'boolean';
        case PageType.DISCUSSION_PAGE:
          return this.duplicateDiscussionPageRule(page.questionId)
                 && typeof this.duplicateDiscussionPageRule(page.questionId) === 'boolean'
                 && questionSet.has(page.questionId);
        default:
          return true;
      }
    });

    if(!quizContentValid){
      this.forceValidation = true;
      showSnackbar("Invalid Quiz content", true);
      return;
    }

    // Confirmed is true by default when creating quizzes
    let confirmed = true;
    if (this.isEditing) {
      confirmed = confirm("Update quiz?");
    }

    if (confirmed) {
      // For every page, save contents of editor
      const editorResponses = await Promise.all(
        this.pages.map(async page => {
          const editorResponse = await saveTinyMceEditorContent(
            `tmce-${page.__mountedId}`
          );
          if (editorResponse && editorResponse.success) {
            if (editorResponse.payload) {
              page.content = editorResponse.payload;
            }
            return true;
          }

          return false;
        })
      );

      const editorsValid = editorResponses.every(
        editorResponse => editorResponse
      );
      if (editorsValid) {
        await this.createQuiz();
      } else {
        showSnackbar("Failed to save quiz content.", true);
      }
    }
  }

  /**
   * Check if `clone` parameter was passed.
   * If `true`, that means that a quiz clone is being created
   */
  get isCloning(): boolean {
    return !!this.$route.query.clone;
  }

  get clonedQuizName() {
    if (this.isCloning && this.quizToBeCloned && this.quizToBeCloned.title) {
      return this.quizToBeCloned.title;
    }

    return `-NA-`;
  }
  get pageTitle() {
    if (this.isEditing && !this.isCloning) {
      return "Updating quiz session";
    } else if (this.isCloning) {
      return `Creating a copy of quiz session "${this.clonedQuizName}"`;
    } else {
      return "Create new quiz session";
    }
  }

  get pageAction() {
    if (this.isEditing && !this.isCloning) {
      return "Update quiz session";
    } else if (this.isCloning) {
      return "Save new copy";
    } else {
      return "Create quiz session";
    }
  }

  private createQuiz() {
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

    // Note: Seconds are being set to 0 (round down to minute)
    const availableStart = new Date(
      this.startDate.getFullYear(),
      this.startDate.getMonth(),
      this.startDate.getDate(),
      this.startTime.getHours(),
      this.startTime.getMinutes(),
      0
    ).toString();

    // Note: Seconds are being set to 0 (round down to minute)
    const availableEnd = new Date(
      this.endDate.getFullYear(),
      this.endDate.getMonth(),
      this.endDate.getDate(),
      this.endTime.getHours(),
      this.endTime.getMinutes(),
      0
    ).toString();

    const outgoingQuiz: IQuizOverNetwork = {
      title: this.quizTitle,
      availableStart,
      availableEnd,
      pages: outgoingPages,
      course: this.courseId,
      markingConfiguration: this.markingConfiguration,
      groupSize: this.groupSize,
      rubricId: this.rubricId,
      isPublic: this.isPublic
    };

    if (this.isEditing && !this.isCloning) {
      outgoingQuiz._id = this.id;
      this.$store.dispatch("updateQuiz", outgoingQuiz);
    } else {
      // If quiz is not being `edited` (i.e. being created or cloned)
      // Remove the `id` associated with the old quiz
      delete outgoingQuiz._id;
      this.$store.dispatch("createQuiz", outgoingQuiz);
    }
  }

  // The reason for the mounted id is that we need it for rendering purposes
  // but toss it away later for db calls.
  private createPage(index?: number) {
    const output: IQuestionAnswerPage = {
      type: PageType.QUESTION_ANSWER_PAGE,
      title: "Some Title",
      content: "",
      questionId: "",
      timeoutInMins: 2
    };

    this.pagesArray.splice(index || 0, 0, {
      ...output,
      __mountedId: uniqueId()
    });
  }

  private deletePage(index: number) {
    if(this.pagesArray[index]) {
      this.pagesArray.splice(index, 1);
    }
  }

  private up(index: number) {
    if (index === 0) return;
    if (this.pagesArray[index] && this.pagesArray[index - 1]) {
      const items = [this.pagesArray[index - 1], this.pagesArray[index]];
      this.pagesArray.splice(index - 1, 2, items[1], items[0]);
    }
  }

  private down(index: number) {
    if (index === this.pagesArray.length) return;
    if (this.pagesArray[index] && this.pagesArray[index + 1]) {
      const items = [this.pagesArray[index], this.pagesArray[index + 1]];
      this.pagesArray.splice(index, 2, items[1], items[0]);
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
        this.groupSize = loadedQuiz.groupSize!;

        this.startDateString = this.convertServerDateToString(this.startDate);
        this.endDateString = this.convertServerDateToString(this.endDate);
        // Padding isn't necessary but for visualisation purposes it is
        this.startTimeString = this.startTime
          ? `${this.startTime.getHours()}`.padStart(2, "0") +
            ":" +
            `${this.startTime.getMinutes()}`.padStart(2, "0")
          : "";
        this.endTimeString = this.endTime
          ? `${this.endTime.getHours()}`.padStart(2, "0") +
            ":" +
            `${this.endTime.getMinutes()}`.padStart(2, "0")
          : "";

        this.quizTitle = loadedQuiz.title;
        this.rubricId = loadedQuiz.rubricId!;
        this.markingConfiguration =
          loadedQuiz.markingConfiguration || this.markingConfiguration;
        this.isPublic = loadedQuiz.isPublic || false;
        this.pagesArray = loadedQuiz.pages.map(page => {
          (page as any).__mountedId = uniqueId();
          return page;
        });

        if (this.isCloning) {
          this.quizToBeCloned = Object.assign({}, loadedQuiz);
        }
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
    return () => {
      const hasDiscussion = this.pages.some(page => {
        return page.type === PageType.DISCUSSION_PAGE;
      });
      return (
        hasDiscussion ||
        "No dicussion page found, should have one present in the quiz"
      );
    };
  }

  // Compares the start and end date values and existence
  validDateRule(validator: 'startDateTime' | 'endDateTime') {
    return (value?: any) => {
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

        const today = new Date();

        if (validator === 'startDateTime'){
          return (availableStart.getTime() > today.getTime() 
                  || "Start date/time can't be older than current time");
        } else {
          return (availableEnd.getTime() > today.getTime() 
                  ||"End date/time can't be older than current time" )
        }
      } else {
        return "Start date/time and end date/time are required";
      }
    };
  }

  get existenceRule() {
    return Utils.Rules.existenceRule;
  }

  get duplicateQuestionPageRule() {
    return (id: string) => {
      const totalIds = this.pages.reduce((count: number, page) => {
        if (
          page.type === PageType.QUESTION_ANSWER_PAGE &&
          page.questionId === id
        ) {
          count = count + 1;
        }
        return count;
      }, 0);
      return totalIds == 1 || "Duplicate questions detected";
    };
  }

  get duplicateDiscussionPageRule() {
    return (id: string) => {
      const totalIds = this.pages.reduce((count: number, page) => {
        if (page.type === PageType.DISCUSSION_PAGE && page.questionId === id) {
          count = count + 1;
        }
        return count;
      }, 0);
      return totalIds == 1 || "Duplicate discussions detected";
    };
  }

  /**
   * Converts server-specified date to 'yyyy-mm-dd' string
   * compatible with v-date-picker
   * Ref: https://stackoverflow.com/a/50130338
   */
  private convertServerDateToString(date: Date) {
    try {
      const quizDateTime = new Date(date);
      return (new Date(quizDateTime.getTime() - (quizDateTime.getTimezoneOffset() * 60000 ))
        .toISOString().split("T")[0]).toString();
    } catch (e) {
      console.error('Date invalid');
      return new Date(Date.now()).toString();
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../css/app.scss";
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
  justify-content: center;
}

.p-controls {
  display: flex;
  padding: 1rem;
  flex-shrink: 0;
}

.p-controls > * {
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

/**Custom styling*/
.divider.vertical-divider {
  width: 1px;
  height: 40px;
  margin: 1.5rem 50% 0 50%;
}

.divider {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.delete-btn,
.add-btn{
  height: 30px;
  font-size: 0.875em;
}

.page-multipliable-controls{
  display: flex;
  flex-flow: row nowrap;

  position: absolute;
  top: 0.5rem;
  right: 40px;
}

.page-elevation-controls{
  display: flex;
  flex-flow: column;
  color: $dark-grey;

  .move-btn,
  .move-btn-disabled{
    font-size: 0.8em;
    height: 25px;
    width: 25px;

    &:last-of-type{
      margin-top: -4px;
    }

  }

  .move-btn-disabled{
    color: $grey;
    cursor: default;
  }

  .move-btn:hover{
    @include transparent-color($primary, false);
  }
}

</style>
