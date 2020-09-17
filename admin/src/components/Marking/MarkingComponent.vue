<template>
    <div class="marking-rubric">
        <h3>Rubric</h3>
        <table class="marks-table"
               v-if="marks">
            <tr v-for="(c, index) in associatedCriterias"
                class="values-row"
                :key="c._id">

                <td class="category-data"> {{c.name}}</td>
                <td v-for="m in possibleMarkValues"
                    :key="m">
                    <label> {{ m }}
                        <input type="radio"
                               v-if="marks"
                               class="number-mark"
                               v-model="marks.marks[index].value"
                               :value="m" />
                    </label>
                </td>
                <td>
                    <textarea v-if="marks" placeholder="Comments ..."
                        v-model="marks.marks[index].feedback"></textarea>
                </td>
            </tr>
        </table>
        
        <div class="general-feedback"> <h3>General Feedback</h3>
            <textarea v-if="marks"
                placeholder="General feedback ..."
                v-model="marks.feedback"></textarea>
        </div>
        <div class="save-controls">
            <button type="button"
                    class="primary-cl"
                    @click.prevent="saveMarks">Save Marks</button>
        </div>

    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage, IQuestionAnswerPage, QuizSessionDataObject } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import * as Schema from "../../../../common/interfaces/DBSchema";
import { API } from "../../../../common/js/DB_API";
import { EventBus, EventList, SnackEvent } from "../../EventBus";

Component.registerHooks([
    'updated',
    'created'
])

@Component({})
export default class MarkingComponent extends Vue {
    private marks: Schema.Mark | undefined | null = null;

    get currentMarkingContext() {
        return this.$store.getters.currentMarkingContext;
    }

    async fetchMarksForQuestion() {
        try {
            const currentMarkingContext = this.currentMarkingContext;
            const quizSessionId = currentMarkingContext.currentQuizSessionId;
            const questionId = currentMarkingContext.currentQuestionId;
            const quizSessionIdMarks: Schema.Mark = await API.request(API.GET, API.MARKS + `quizSessionId/${quizSessionId}`, {});
            const marker = this.marker;
            let marks: Schema.Mark | null = null;
            if (Array.isArray(quizSessionIdMarks)) {
                marks = quizSessionIdMarks.find((mark) => mark.markerId === marker._id);
                if (!marks) throw new Error();
                // If there are any missing marks, add default values or negative values?
                const missingCriterias = this.associatedCriterias.filter((criteria) => {
                  return marks!.marks.findIndex((mark) => {
                    return criteria._id === mark.criteriaId;
                  }) === -1;
                });

                missingCriterias.forEach((mark) => {
                  marks!.marks.push({
                    criteriaId: mark._id!,
                    value: 0,
                    feedback: ''
                  });
                });

                this.marks = marks;
            } else {
                throw new Error();
            }
        } catch (e) {
            this.marks = this.initMark();
        }
    }

    initMark(): Schema.Mark {
        const currentMarkingContext = this.currentMarkingContext;
        const quizSessionId = currentMarkingContext.currentQuizSessionId;
        const currentQuizSessionInfoObject = this.$store.getters.currentQuizSessionInfoObject;
        const marker = this.marker;
        const defaultMarks = this.associatedCriterias.reduce((arr: Schema.MarkCriteria[], value) => {
          arr.push({
            value: 0,
            criteriaId: value._id!
          });
          return arr;
        }, []);

        return {
            quizSessionId: quizSessionId,
            markerId: null,
            userId: undefined,
            username: undefined,
            markerUsername: undefined,
            timestamp: null,
            quizId: null,
            marks: defaultMarks,
            feedback: "",
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

    get quiz(): IQuiz {
        return this.$store.getters.currentQuiz;
    }

    get rubrics(): Schema.IRubric[] {
        return this.$store.getters.rubrics;
    }

    // The rubric associated with the quiz
    get associatedRubric(): Schema.IRubric | undefined {
      return this.rubrics.find((rubric) => {
        return this.quiz.rubricId === rubric._id;
      });
    }


    get criterias(): Schema.ICriteria[] {
      return this.$store.getters.criterias;
    }

    // The criteria associated with the quiz
    get associatedCriterias(): Schema.ICriteria[] {
      if (this.associatedRubric) {
        return this.associatedRubric.criterias.reduce((arr: Schema.ICriteria[], id) => {
          const maybeCriteria = this.criterias.find((criteria) => {
            return criteria._id === id;
          });

          if (maybeCriteria) {
            arr.push(maybeCriteria);
          }

          return arr;
        }, []);
      } else {
        return [];
      }
    }

    get markingConfig(): Schema.MarkConfig {
        return this.quiz.markingConfiguration!;
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
        const empty = JSON.parse(JSON.stringify(this.initMark().marks));
        return Object.keys(empty);
    }

    async saveMarks() {
        try {


            if (!this.marks || !this.markingConfig || !this.currentQuestionId || !this.currentQuizSessionId) return;

            const marksToBeSaved: Schema.Mark = Object.assign({}, this.marks);

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
            marksToBeSaved.quizId = this.quiz._id!;
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
        const message: SnackEvent = {
            message: "Saved a mark"
        }

        EventBus.$emit(EventList.PUSH_SNACKBAR, message);
    }

    showErrorMessage() {
        const message: SnackEvent = {
            message: "Failed to save a mark",
            error: true
        }

        EventBus.$emit(EventList.PUSH_SNACKBAR, message);        
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

<style scoped lang="scss">
@import "../../../css/app.scss";

.general-feedback {
    padding: 0.5rem;

}

.general-feedback > textarea {
    background: white;
}

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
    flex-flow: row-reverse;
}
</style>