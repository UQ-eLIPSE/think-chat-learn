<template>
    <div class="marking-rubric"
         v-if="quiz.markingConfiguration">
        <label> Mark (Maximum mark: {{ quiz.markingConfiguration.maximumMarks }})
            <input type="number"
                   :min="0"
                   :max="quiz.markingConfiguration.maximumMarks"
                   class="simple-mark-input"
                   v-if="marks"
                   v-model="marks.mark.value" /></label>

        <div class="save-controls">
            <button type="button"
                    class="primary"
                    @click.prevent="saveMarks">Save Marks</button>
            <div v-if="saveStatus.message.length > 0"
                 :class="saveMessageClasses">{{ saveStatus.message }}</div>

        </div>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage, IQuestionAnswerPage, QuizSessionDataObject } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import * as Schema from "../../../../common/interfaces/DBSchema";
import { API } from "../../../../common/js/DB_API";

Component.registerHooks([
    'updated',
    'created'
])

@Component({})
export default class SimpleMarkingComponent extends Vue {
    private marks: Schema.SimpleMark | undefined | null = null;
    private saveStatus: { message: string, success: boolean } = { message: '', success: true };

    get saveMessageClasses() {
        if (this.saveStatus.message.length === 0) return {};
        return {
            'success': this.saveStatus.success,
            "error": !this.saveStatus.success
        }
    }
    get currentMarkingContext() {
        return this.$store.getters.currentMarkingContext;
    }

    async fetchMarksForQuestion() {
        try {
            const currentMarkingContext = this.currentMarkingContext;
            const quizSessionId = currentMarkingContext.currentQuizSessionId;
            const questionId = currentMarkingContext.currentQuestionId;
            const quizSessionIdMarks = await API.request(API.GET, API.MARKS + `quizSessionId/${quizSessionId}/questionId/${questionId}`, {});
            const marker = this.marker;
            let marks: any = null;
            if (Array.isArray(quizSessionIdMarks)) {
                marks = quizSessionIdMarks.find((mark) => mark.markerId === marker._id)
                if (!marks) throw new Error();
                this.marks = marks;
            } else {
                throw new Error();
            }
        } catch (e) {
            this.marks = this.initMark();
        }
    }

    initMark(): Schema.SimpleMark {
        const currentMarkingContext = this.currentMarkingContext;
        const quizSessionId = currentMarkingContext.currentQuizSessionId;
        const questionId = currentMarkingContext.currentQuestionId;
        const currentQuizSessionInfoObject = this.$store.getters.currentQuizSessionInfoObject;
        const marker = this.marker;
        return {
            type: Schema.MarkMode.SIMPLE_MARKING,
            questionId: questionId,
            quizSessionId: quizSessionId,
            markerId: null,
            userId: undefined,
            username: undefined,
            markerUsername: undefined,
            timestamp: null,
            quizId: null,
            mark: {
                value: null,
                feedbackText: ''
            }
        }
    }

    get markingContext() {
        return this.$store.getters.currentMarkingContext;
    }
    get currentQuestionId() {
        if (!this.markingContext) return undefined;
        return this.markingContext.currentQuestionId;
    }

    get currentQuizSessionId() {
        if (!this.markingContext) return undefined;
        return this.markingContext.currentQuizSessionId;
    }

    get quiz() {
        return this.$store.getters.currentQuiz;
    }
    get markingConfig(): Schema.SimpleMarkConfig | undefined {
        if (!this.quiz) return undefined;
        return this.quiz.markingConfiguration;
    }

    get marker() {
        return this.$store.getters.user;
    }

    async saveMarks() {
        try {


            if (!this.marks || !this.markingConfig || !this.currentQuestionId || !this.currentQuizSessionId) return;

            const marksToBeSaved: Schema.SimpleMark = Object.assign({}, this.marks);

            // Update marks metadata
            // Get current question ID
            const markerId = this.marker._id;
            const timestamp = Date.now();
            const quizSessionInfoObject = this.$store.getters.currentQuizSessionInfoObject;


            // Store metadata in mark
            marksToBeSaved.userId = quizSessionInfoObject.user._id;
            marksToBeSaved.username = quizSessionInfoObject.user.username;
            marksToBeSaved.markerId = markerId;
            marksToBeSaved.timestamp = new Date();
            marksToBeSaved.markerUsername = this.marker.username;
            marksToBeSaved.quizId = this.quiz._id;
            const multipleMarking = this.markingConfig.allowMultipleMarkers;

            if (multipleMarking) {
                const markSaveResponse = await API.request(API.POST, API.MARKS + `multiple/createOrUpdate/quizSessionId/${this.currentQuizSessionId}/questionId/${this.currentQuestionId}`, marksToBeSaved);
                if (markSaveResponse) {
                    this.showSuccessMessage();
                } else{
                    this.showErrorMessage();
                }
            } else {
                const markSaveResponse = await API.request(API.POST, API.MARKS + `createOrUpdate/quizSessionId/${this.currentQuizSessionId}/questionId/${this.currentQuestionId}`, marksToBeSaved);
                if (markSaveResponse) {
                    this.showSuccessMessage();
                } else {
                    this.showErrorMessage();
                }
            }

        } catch (e) {
            console.log('Error: Could not save mark');
        }
    }

    showSuccessMessage() {
        this.saveStatus.message = "Saved";
        this.saveStatus.success = true;
        setTimeout(() => {
            this.saveStatus.message = '';
            this.saveStatus.success = true;
        }, 2000);
    }

    showErrorMessage() {
        this.saveStatus.message = "Error";
        this.saveStatus.success = false;
    }
    async created() {
        await this.fetchMarksForQuestion();
    }


    @Watch('currentQuizSessionId')
    async quizSessionChangeHandler() {
        this.fetchMarksForQuestion();
    }

    @Watch('currentQuestionId')
    async questionChangeHandler() {
        this.fetchMarksForQuestion();
    }


}
</script>
<style scoped>
.sidebar {
    color: white;
    text-shadow: rgb(85, 85, 85) 0.05em 0.05em 0.05em;
    width: 18rem;
    font-size: 1.2rem;
    overflow-y: hidden;
    background: rgb(150, 85, 102);
}

.course-name {
    font-style: italic;
    margin: 1rem 2rem 1.5rem;
}

.moochat-name {
    line-height: 1;
    margin: 2rem 2rem 1rem;
}

.question-box {
    display: flex;
    flex-direction: column;
    border: 0.1em solid teal;
    padding: 0.5rem;
}


.success {
    background: green;
    width: 50%;
    color: white;
}

.error {
    background: lightcoral;
    width: 50%;
    color: white;
}

.save-controls {
    display: flex;
}

.simple-mark-input {
    font-size: 1.2em;
    padding: 0.5rem;
}
</style>