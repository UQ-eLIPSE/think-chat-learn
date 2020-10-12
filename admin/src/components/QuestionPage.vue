<template>
  <v-container>
    <v-form ref="form">
      <h1 class="moocchat-title">Question Editor</h1>
      <v-container fluid grid-list-md>
        <v-layout row wrap>
          <v-flex xs6>
            <b-field label="Set the title of the question">
              <v-text-field
                v-model="pageQuestion.title"
                :rules="[existenceRule]"
                outline single-line
              />
            </b-field>
          </v-flex>
          <v-flex xs6>
            <b-field label="Set the question type">
              <v-overflow-btn
                :items="questionTypeDropDown"
                v-model="pageQuestion.type"
                :rules="[existenceRule]"
                outline
              />
            </b-field>
          </v-flex>
          <!-- All questions have some form of content -->
          <v-flex xs12>
            <b-field label="Set the content of the question">
              <TinyMce :editorId="editorId" :options="{}" v-model="pageQuestion.content" />
            </b-field>
          </v-flex>
          <br />
          <!-- We should only let users create one question at a time. Additionally we conditionally
          render the form based on the chosen question type.-->

          <!-- MCQ pretty much allow the creation of options -->
          <!-- TODO implement it with Vuetify -->
          <div v-if="pageQuestion.type === QuestionType.MCQ">
            <!-- Render the options appropiately. It is a bit naughty to set the key as the index due to
            the possibility of deletion of options.-->
            <div v-for="option in pageQuestion.options" :key="option.mountedId">
              <span>Option Content</span>
              <input
                v-model="option.content"
                type="textarea"
                placeholder="Place option content here"
              />

              <br />

              <select v-model="option.isCorrect">
                <option :value="true">True</option>
                <option :value="false">False</option>
              </select>

              <span>Option Index</span>
              <input v-model.number="option.index" type="number" />
            </div>
            <v-btn type="button" @click="addOption()">Add Option</v-btn>
          </div>

          <!-- Note for now, qualitative questions only need be known that it is a qualitative for its definition -->
          <v-flex xs12>
            <button
              type="button"
              class="primary-cl button-cs"
              @click="submitQuestion()"
            >{{ isEditing ? "Edit Question" : "Create Question" }}</button>
          </v-flex>
        </v-layout>
      </v-container>
    </v-form>
  </v-container>
</template>

<style scoped lang="scss">
@import "../../css/app.scss";
.container {
  width: 100%;
}

.moocchat-title {
  margin: 6px;
}
</style>
<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

import {
  TypeQuestion,
  IQuestionMCQ,
  IQuestionOption,
  IQuestion
} from "../../../common/interfaces/ToClientData";
import { QuestionType } from "../../../common/enums/DBEnums";
import { getAdminLoginResponse } from "../../../common/js/front_end_auth";
import { Utils } from "../../../common/js/Utils";
import { IQuestionQualitative } from "../../../common/interfaces/DBSchema";
import API from "../../../common/js/DB_API";
import TinyMce from "./TinyMce.vue";
import uniqueId from "../util/uniqueId";
import { showSnackbar } from '../EventBus';
import { saveTinyMceEditorContent } from '../util/TinyMceUtils';

interface DropDownConfiguration {
  text: string;
  value: string;
}

interface FrontEndQuestionOption extends IQuestionOption {
  mountedId: string;
}

const defaultOption: FrontEndQuestionOption = {
  content: "",
  index: 0,
  isCorrect: true,
  mountedId: uniqueId()
};

const defaultQuestion: IQuestionQualitative = {
  type: QuestionType.QUALITATIVE,
  title: "",
  content: ""
};

const IMAGE_LOCATION = process.env.VUE_APP_IMAGE_LOCATION;

@Component({
  components: {
    TinyMce
  }
})
export default class QuestionPage extends Vue {
  // Based on the existence of the id, we may initialize the question differently
  @Prop({ default: "" }) private id!: string;

  private editorId: string = "";
  // Setting default question
  private pageQuestion: TypeQuestion = defaultQuestion;

  // Default dropdown behaviour for questions
  private questionTypeDropDown: DropDownConfiguration[] = [
    {
      text: QuestionType.QUALITATIVE,
      value: QuestionType.QUALITATIVE
    }
  ];

  // Import the types as well
  get QuestionType() {
    return QuestionType;
  }

  get isEditing(): boolean {
    return this.id !== "";
  }

  // Course id based on token
  get courseId() {
    const loginDetails = getAdminLoginResponse();

    return loginDetails ? loginDetails.courseId : "";
  }

  get questions(): TypeQuestion[] {
    return this.$store.getters.questions;
  }

  private addOption() {
    if (this.pageQuestion.type === QuestionType.MCQ) {
      const newOption = Object.assign({}, defaultOption);
      newOption.mountedId = uniqueId();

      Vue.set(
        this.pageQuestion.options,
        this.pageQuestion.options.length,
        newOption
      );
    }
  }

  private createQuestion() {
    // Remember to strip the data appropiately for backend purposes
    let outgoingQuestion: TypeQuestion;
    if (this.pageQuestion.type === QuestionType.MCQ) {
      // Remember to strip each option
      outgoingQuestion = {
        content: this.pageQuestion.content,
        courseId: this.courseId,
        title: this.pageQuestion.title,
        type: this.pageQuestion.type,
        options: this.pageQuestion.options.reduce((output, element) => {
          output.push({
            index: element.index,
            content: element.content,
            isCorrect: element.isCorrect
          });
          return output;
        }, [] as IQuestionOption[])
      };
    } else if (this.pageQuestion.type === QuestionType.QUALITATIVE) {
      outgoingQuestion = {
        content: this.pageQuestion.content,
        title: this.pageQuestion.title,
        type: this.pageQuestion.type,
        courseId: this.courseId
      };
    } else {
      throw Error("Somehow outgoing question is assigned an invalid type");
    }

    if (this.isEditing) {
      outgoingQuestion._id = this.id;
      this.$store.dispatch("editQuestion", outgoingQuestion);
    } else {
      this.$store.dispatch("createQuestion", outgoingQuestion);
    }
  }

  private async submitQuestion() {
    // Perform a basic error check based on the rules
    const valid = (this.$refs.form as any).validate();

    if (!valid) {
      showSnackbar("Failed to generate question. Check the form for any errors", true);
      return;
    }

    const confirmed = confirm("Save question?");

    if (confirmed && this.editorId) {
      const editorResponse = await saveTinyMceEditorContent(this.editorId);
      if (editorResponse && editorResponse.success) {
        if (editorResponse.payload) {
          this.pageQuestion.content = editorResponse.payload;
        }

        await this.createQuestion();
      } else {
          showSnackbar('Failed to save question content', true);
      }
    }
  }

  private created() {
    this.editorId = uniqueId();
  }
  private mounted() {
    // Based on the id, potentially grab the details from the question
    if (this.id !== "") {
      const maybeQuestion = this.questions.find(element => {
        return element._id === this.id;
      });

      if (!maybeQuestion) {
        throw Error("Retrieved question does not exist");
      } else {
        this.pageQuestion = maybeQuestion;
      }
    }

  }

  /**
   * Rules here
   */
  get existenceRule() {
    return Utils.Rules.existenceRule;
  }
}
</script>