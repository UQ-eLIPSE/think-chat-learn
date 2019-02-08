<template>
    <div class="container">
        <span>Question Title</span><input v-model="pageQuestion.title" type="text"/>

        <br>
        <span>Question Type</span><select v-model="pageQuestion.type">
            <option v-for="type in QuestionType" :key="type" :value="type">{{type}}</option>
        </select>

        <br>
        <!-- All questions have some form of content -->
        <span>Question Content</span><input v-model="pageQuestion.content" type="textarea" placeholder="Set the content of the page"/>

        <br>
        <!-- We should only let users create one question at a time. Additionally we conditionally
             render the form based on the chosen question type. -->

        <!-- MCQ pretty much allow the creation of options -->
        <div v-if="pageQuestion.type === QuestionType.MCQ">
            <!-- Render the options appropiately. It is a bit naughty to set the key as the index due to
                 the possibility of deletion of options. -->
            <div v-for="option in pageQuestion.options" :key="option.mountedId">
                <span>Option Content</span><input v-model="option.content" type="textarea" placeholder="Place option content here"/>

                <br>

                <select v-model="option.isCorrect">
                    <option :value="true">True</option>
                    <option :value="false">False</option>
                </select>

                <span>Option Index</span><input v-model.number="option.index" type="number"/>
            </div>
            <button type="button" @click="addOption()">Add Option</button>

        </div>

        <!-- Note for now, qualitative questions only need be known that it is a qualitative for its definition -->

        <button type="button" @click="submitQuestion()">{{ isEditing ? "Edit Question" : "Create Question" }}</button>
    </div>
</template>

<style scoped>
.container  {
    width: 100%;
}
</style>
<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { TypeQuestion,
    IQuestionMCQ, IQuestionOption, IQuestion } from "../../../common/interfaces/ToClientData";
import { QuestionType } from "../../../common/enums/DBEnums";
import { getAdminLoginResponse } from "../../../common/js/front_end_auth";

interface FrontEndQuestionOption extends IQuestionOption {
    mountedId: number;
}

const defaultOption: FrontEndQuestionOption = {
    content: "",
    index: 0,
    isCorrect: true,
    mountedId: 0
};

const defaultQuestion: IQuestionMCQ = {
    type: QuestionType.MCQ,
    options: [defaultOption],
    title: "",
    content: ""
};

@Component({
})
export default class QuestionPage extends Vue {

    // Based on the existence of the id, we may initialize the question differently
    @Prop({ default: "" }) private id!: string;


    // Setting default question
    private pageQuestion: TypeQuestion = Object.assign({}, defaultQuestion);

    // Stored for rendering purposes
    private mountedId: number = 0;


    // Import the types as welll
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
            newOption.mountedId = ++this.mountedId;

            Vue.set(this.pageQuestion.options, this.pageQuestion.options.length, newOption);
        }

    }

    private submitQuestion() {
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

    private mounted() {
        // Based on the id, potentially grab the details from the question
        if (this.id !== "") {
            const maybeQuestion = this.questions.find((element) => {
                return element._id === this.id;
            });

            if (!maybeQuestion) {
                throw Error("Retrieved question does not exist");
            } else {
                this.pageQuestion = Object.assign({}, maybeQuestion);
            }
        }
    }

}
</script>