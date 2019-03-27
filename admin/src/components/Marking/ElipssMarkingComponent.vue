<template>
    <div class="marking-rubric">
        <h3>Rubric</h3>
        <table class="marks-table"
               v-if="marks">
            <tr>Individual Mark</tr>
            <tr v-for="c in individualCategories"
                class="values-row"
                :key="c">

                <td class="category-data"> {{c}}</td>

                <td v-for="m in possibleMarkValues"
                    :key="m">
                    <label> {{ m }}
                        <input type="radio"
                               v-if="marks"
                               class="number-mark"
                               v-model="marks.mark.value[c]"
                               :value="m" />
                    </label>
                </td>
            </tr>
            <tr>Group Mark</tr>
            <tr v-for="c in groupCategories"
                class="values-row"
                :key="c">

                <td class="category-data"> {{c}}</td>

                <td v-for="m in possibleMarkValues"
                    :key="m">
                    <label> {{ m }}
                        <input type="radio"
                               v-if="marks"
                               class="number-mark"
                               v-model="marks.mark.value[c]"
                               :value="m" />
                    </label>
                </td>
            </tr>

            </tr>
        </table>
        <!-- <label> Feedback
                        <textarea v-if="marks"
                                  v-model="marks.mark.feedbackText"></textarea>
                    </label> -->
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
export default class ElipssMarkingComponent extends Vue {
    private marks: Schema.ElipssMark | undefined | null = null;
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
        console.log('Fetching marks')
        try {
            const currentMarkingContext = this.currentMarkingContext;
            const quizSessionId = currentMarkingContext.currentQuizSessionId;
            const questionId = currentMarkingContext.currentQuestionId;
            const quizSessionIdMarks = await API.request(API.GET, API.MARKS + `quizSessionId/${quizSessionId}/questionId/${questionId}`, {});
            console.log('Marks for this question for quiz session: ', quizSessionIdMarks);
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

    initMark(): Schema.ElipssMark {
        const currentMarkingContext = this.currentMarkingContext;
        const quizSessionId = currentMarkingContext.currentQuizSessionId;
        const questionId = currentMarkingContext.currentQuestionId;
        const currentQuizSessionInfoObject = this.$store.getters.currentQuizSessionInfoObject;
        const marker = this.marker;
        return {
            type: Schema.MarkMode.ELIPSS_MARKING,
            questionId: questionId,
            quizSessionId: quizSessionId,
            markerId: null,
            userId: undefined,
            username: undefined,
            markerUsername: undefined,
            timestamp: null,
            mark: {
                value: {
                    evaluating: null,
                    interpreting: null,
                    analysing: null,
                    makingArguments: null,
                    accuracyOfArgument: null,
                    expressingAndResponding: null,
                    depthOfReflection: null
                },
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

    get individualCategories() {
        return this.categories.filter((c) => {
            switch (c) {
                case "evaluating":
                case "interpreting":
                case "depthOfReflection":
                    return true;
                default:
                    return false;
            }
        })
    }

    get groupCategories() {
        return this.categories.filter((c) => {
            switch (c) {
                case "analysing":
                case "makingArguments":
                case "accuracyOfArgument":
                case "expressingAndResponding":
                    return true;
                default:
                    return false;
            }
        })
    }

    get quiz() {
        return this.$store.getters.currentQuiz;
    }
    get markingConfig(): Schema.ElipssMarkConfig | undefined {
        if (!this.quiz) return undefined;
        return this.quiz.markingConfiguration;
    }
    get possibleMarkValues() {
        if (!this.markingConfig) {
            return [];
        } else {
            return new Array(this.markingConfig.maximumMarks).fill(0).map((m, i) => i + 1);
        }
    }


    get marker() {
        return this.$store.getters.user;
    }

    get categories() {
        const empty = JSON.parse(JSON.stringify(this.initMark().mark.value));
        return Object.keys(empty);
    }

    async saveMarks() {
        try {


            if (!this.marks || !this.markingConfig || !this.currentQuestionId || !this.currentQuizSessionId) return;

            const marksToBeSaved: Schema.ElipssMark = Object.assign({}, this.marks);

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

            const multipleMarking = this.markingConfig.allowMultipleMarkers;

            if (multipleMarking) {
                const markSaveResponse = await API.request(API.POST, API.MARKS + `multiple/createOrUpdate/quizSessionId/${this.currentQuizSessionId}/questionId/${this.currentQuestionId}`, marksToBeSaved);
                if (markSaveResponse) {
                    this.showSuccessMessage();
                }
            } else {
                const markSaveResponse = await API.request(API.POST, API.MARKS + `createOrUpdate/quizSessionId/${this.currentQuizSessionId}/questionId/${this.currentQuestionId}`, marksToBeSaved);
                if (markSaveResponse) {
                    this.showSuccessMessage();
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
        console.log('Watch change detected');
        this.fetchMarksForQuestion();
    }

    @Watch('currentQuestionId')
    async questionChangeHandler() {
        console.log('Watch change detected');
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

.values-row {
    display: flex;
}

.categories {
    display: flex;
    flex-direction: column;
}

.number-mark {
    min-width: 2rem;
    border: 0.1rem solid rgba(1, 0, 0, 0.1);
}

.category-data {
    min-width: 300px;
}

.marks-table {
    border-collapse: collapse;
}

.marks-table td,
.marks-table th {
    border: 1px solid #ddd;
    padding: 8px;
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
</style>