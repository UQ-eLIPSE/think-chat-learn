<template>
  <v-container>
    <v-form ref="form">
      <h1 class="moocchat-title">Question Editor</h1>
      <v-container fluid grid-list-md>
        <v-layout row wrap>
          <v-flex xs12>
            <b-field label="Set the title of the question">
              <v-text-field
                label="Question Title"
                v-model="pageQuestion.title"
                :rules="[existenceRule]"
                outline
              />
            </b-field>
          </v-flex>
          <v-flex xs12>
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
              <!-- <QuillEditor :id="`question-quill`" v-model="pageQuestion.content"></QuillEditor> -->
              <TinyMce2 :id="editorId" :options="{}" v-model="pageQuestion.content" />
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
            <v-btn
              type="button"
              @click="submitQuestion()"
            >{{ isEditing ? "Edit Question" : "Create Question" }}</v-btn>
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

.moocchat-title {
  margin: 6px;
}
</style>
<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import QuillEditor from "./QuillEditor.vue";
import {
  TypeQuestion,
  IQuestionMCQ,
  IQuestionOption,
  IQuestion
} from "../../../common/interfaces/ToClientData";
import { QuestionType } from "../../../common/enums/DBEnums";
import { getAdminLoginResponse } from "../../../common/js/front_end_auth";
import { Utils } from "../../../common/js/Utils";
import {
  EventBus,
  EventList,
  SnackEvent,
  ModalEvent,
  BlobUpload
} from "../EventBus";
import { IQuestionQualitative } from "../../../common/interfaces/DBSchema";
import API from "../../../common/js/DB_API";
import TinyMce2 from "./TinyMce2.vue";
import uniqueId from "../util/uniqueId";

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
    QuillEditor,
    TinyMce2
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

  // Quill Upload information
  private uploadCount: number = 0;
  private uploads: BlobUpload[] = [];
  private changeCount: number = 0;

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

  /**
   * Saves editor content and modify resource
   */
  private saveTinyMceEditorContent(
    editorId: string
  ): Promise<{ success: boolean; payload?: string; messages?: string[] }> {
    const rejectPayload = {
      success: false,
      messages: ["Editor contents could not be saved"]
    };

    return new Promise((resolve, _reject) => {
      try {
        console.log('tinymce: ', tinymce);
        // Fetch `editor` associated with this component
        const editor = (tinymce.editors || [])[editorId];
        // If error does not exist, something is wrong since if this component exists,
        // the corresponding TinyMCE editor should also exist
        console.log('editor: ', editor);
        if (!editor) return resolve(rejectPayload);

        // Call the `uploadImages` hook and pass a callback function to be executed
        // after `uploadImages` resolves.
        editor.uploadImages((response: { status: boolean; element: any }[]) => {
            console.log('uploadImages cb:', response);
          if (!response) return resolve(rejectPayload);

          // Check for unexpected response type
          if (!Array.isArray(response)) return resolve(rejectPayload);

          // Resolve successfully if there are no images
          if (response.length === 0) return resolve({ success: true });

          // Resolve if every image was able to be uploaded successfully
          if (response.length && response.every(r => r.status === true)) {
            const content = editor.getContent();
            return resolve({ success: true, payload: content });
          }

          // Reject implicitly
          return resolve(rejectPayload);
        });
      } catch (e) {
        console.log(e);
        // Reject implicitly if an error is caught
        return resolve(rejectPayload);
      }
    });
  }

  // Duplication from before
  private handleQuillUpload(blobs: BlobUpload[]) {
    // Since we are concating rather than appending, we have to count each transaction
    // rather than checking total array length
    this.uploads = this.uploads.concat(blobs);

    // We should start uploading in a form, do nothing elsewise

    const tempForm = new FormData();
    this.uploads.forEach(upload => {
      tempForm.append(upload.id, upload.blob);
    });
    API.uploadForm("image/imageUpload", tempForm).then(
      (files: { fieldName: string; fileName: string }[]) => {
        const payload: SnackEvent = {
          message: "Finished uploading associated images"
        };
        EventBus.$emit(EventList.PUSH_SNACKBAR, payload);

        for (let file of files) {
          // For the sake of TypeScript
          if (this.pageQuestion && this.pageQuestion.content) {
            this.pageQuestion.content = this.pageQuestion.content.replace(
              file.fieldName,
              IMAGE_LOCATION + file.fileName
            );
          }
        }

        // Reset the upload counters and then create the quiz
        this.uploads = [];
        this.uploadCount = 0;

        this.createQuestion();
      }
    );
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

  private showSnackbar(messageText: string, isError?: boolean) {
    const message: SnackEvent = {
      message: messageText,
      error: isError || false
    };
    EventBus.$emit(EventList.PUSH_SNACKBAR, message);
    return;
  }

  private async submitQuestion() {
    // Perform a basic error check based on the rules
    const valid = (this.$refs.form as any).validate();

    if (!valid) {
      this.showSnackbar("Failed to generate question. Check the form for any errors", true);
      return;
    }

    const confirmed = confirm("Save question?");

    if (confirmed && this.editorId) {
      const tinyResponse = await this.saveTinyMceEditorContent(this.editorId);
      if (tinyResponse && tinyResponse.success) {
        if (tinyResponse.payload) {
          this.pageQuestion.content = tinyResponse.payload;
        }

        await this.createQuestion();
      } else {
          this.showSnackbar('Failed to save question content', true);
          console.log(tinyResponse);
      }
    }
    // // Set one is to upload quill which then follows creating the quiz
    // const message: ModalEvent = {
    //     title: this.isEditing ? `Editing question` : `Creating question`,
    //     message: this.isEditing ? `Are you sure to edit question of ID ${this.id}?` : `Are you sure to create the question`,
    //     fn: EventBus.$emit,
    //     data: [EventList.CONSOLIDATE_UPLOADS],
    //     selfRef: EventBus
    // }

    // EventBus.$emit(EventList.OPEN_MODAL, message);
  }

  private destroyed() {
    EventBus.$off(EventList.QUILL_UPLOAD);
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

    EventBus.$on(EventList.QUILL_UPLOAD, this.handleQuillUpload);
  }

  /**
   * Rules here
   */
  get existenceRule() {
    return Utils.Rules.existenceRule;
  }
}
</script>