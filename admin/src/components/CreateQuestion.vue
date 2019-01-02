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
                <span>Option Content</span><input type="textarea" placeholder="Place option content here"/>

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

        <button type="button" @click="createQuestion()">Create Question</button>
    </div>
</template>

<style scoped>
.container  {
    width: 100%;
}
</style>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { TypeQuestion, QuestionType, IQuestionMCQ, IQuestionOption } from "../../../common/interfaces/DBSchema";
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
export default class CreateQuestion extends Vue {

    // Setting default question
    private pageQuestion: TypeQuestion = Object.assign({}, defaultQuestion);

    // Stored for rendering purposes
    private mountedId: number = 0;


    // Import the types as welll
    get QuestionType() {
        return QuestionType;
    }

    // Course id based on token
    get courseId() {
        const loginDetails = getAdminLoginResponse();

        return loginDetails ? loginDetails.courseId : "";
    }


    private addOption() {
        if (this.pageQuestion.type === QuestionType.MCQ) {

            const newOption = Object.assign({}, defaultOption);
            newOption.mountedId = ++this.mountedId;

            Vue.set(this.pageQuestion.options, this.pageQuestion.options.length, newOption);
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

        this.$store.dispatch("createQuestion", outgoingQuestion);
    }

}
</script>