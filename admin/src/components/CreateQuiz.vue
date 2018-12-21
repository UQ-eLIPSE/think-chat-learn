<template>
    <div class="container">
        <span>Quiz Title</span><input v-model="quizTitle" type="text"/>
        <b-datepicker v-model="startDate" placeholder="Select the Start Date" icon="calendar-today"></b-datepicker>
        <b-timepicker v-model="startTime" rounded placeholder="Select the Start Time" icon="clock" hour-formart="format" ></b-timepicker>
        <b-datepicker v-model="endDate" placeholder="Select the End Date" icon="calendar-today"></b-datepicker>
        <b-timepicker v-model="endTime" rounded placeholder="Select the End Time" icon="clock" hour-formart="format" ></b-timepicker>

        <div v-for="(page, index) in pages" :key="index">
            <span>Page Title</span><input v-model="page.title" type="text" placeholder="Set the Question Title"/>
            <span>Page Type</span>
            <select v-model="page.type">
                <option :value="PageType.QUESTION_ANSWER_PAGE">Question Answer Page</option>
                <option :value="PageType.SURVEY_PAGE">Survey Page</option>
                <option :value="PageType.INFO_PAGE">Information Page</option>
                <option :value="PageType.DISCUSSION_PAGE">Discussion Page</option>
            </select>
            <!-- Business logic for rendering based on page type -->
            <!-- TODO make this a proper select box once Questions and Answers are implemented -->
            <select v-model="page.questionId" v-if="page.type === PageType.QUESTION_ANSWER_PAGE">
                <option>Some Default option</option>
            </select>
            <select v-model="page.surveryId" v-else-if="page.type === PageType.SURVEY_PAGE">
                <option> Some Default survey</option>
            </select>

            <span>Page content</span><input v-model="page.content" type="textarea" placeholder="Set the content of the page"/>
        </div>
        <br>
        <button type="button" @click="createPage()">Create new page</button>
        <button type="button" @click="createQuiz()">Create Quiz</button>
    </div>
</template>

<style scoped>
.container  {
    width: 100%;
}
</style>
<script lang="ts">

import {Vue, Component} from "vue-property-decorator";
import { IPage, PageType, 
    IQuestionAnswerPage, IInfoPage, IDiscussionPage, ISurveyPage, IQuiz } from "../../../common/interfaces/DBSchema";
// The front end version of the quiz. Slightly different due to
// mounted id
interface FrontEndPage extends IPage {
    mountedId: number;
}
type Page = IQuestionAnswerPage | IInfoPage | IDiscussionPage | ISurveyPage;

@Component({
})
export default class CreateQuiz extends Vue {
    // Default values for quizzes
    private quizTitle: string = "";

    // The start date in ISO8601. Note that Buefy doesn't really have datetime just date and time unfortunately
    private startDate: Date | null = null;
    private startTime: Date | null = null;
    private endDate: Date | null = null;
    private endTime: Date | null = null;

    // The pages that are wanted to be created. Use
    // a dictionary as we would like to use the temp id
    // instead of index
    private pageDict: {[key: number]: Page} = {};

    // The internal id of pages created. Tossed away when sending
    private mountedId: number = 0;

    // Converts the dictionary to an array based on key number
    get pages() {
        const temp: (IQuestionAnswerPage | IInfoPage | IDiscussionPage | ISurveyPage)[] = [];
        
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

    private createQuiz() {
        // For each quiz we have to figure out the type and assign the appropiate types
        // Output pages
        const outgoingPages: Page[] = [];

        // Iterate through each page and strip the appropaite values
        this.pages.forEach((element) => {
            switch (element.type) {
                case PageType.DISCUSSION_PAGE:
                    outgoingPages.push({
                        title: element.title,
                        content: element.content,
                        type: element.type
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
            this.startTime.getHours(), this.startTime.getMinutes(), this.startTime.getSeconds());

        const availableEnd = new Date(this.endDate.getFullYear(),
            this.endDate.getMonth(), this.endDate.getDate(),
            this.endTime.getHours(), this.endTime.getMinutes(), this.endTime.getSeconds());

        const outgoingQuiz: IQuiz = {
            title: this.quizTitle,
            availableStart,
            availableEnd,
            pages: outgoingPages
        };

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
        Vue.set(this.pageDict, this.mountedId++, output);
    }
}
</script>
