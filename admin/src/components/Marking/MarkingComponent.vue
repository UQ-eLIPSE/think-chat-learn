<template>
    <div class="marking-rubric">
        <Rubric @saved="saveMarks" :username="username" :criteria="associatedCriterias" :mark="marks" :maximumMarks="markingConfig.maximumMarks" />
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage, IQuestionAnswerPage, QuizSessionDataObject } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import * as Schema from "../../../../common/interfaces/DBSchema";
import { API } from "../../../../common/js/DB_API";
import { EventBus, EventList, SnackEvent } from "../../EventBus";
import Rubric from "./Rubric/Rubric.vue";

Component.registerHooks([
    'updated',
    'created'
])

@Component({
    components: {
        Rubric
    }
})
export default class MarkingComponent extends Vue {
    private marks: Schema.Mark | undefined | null = null;

    get currentMarkingContext() {
        return this.$store.getters.currentMarkingContext;
    }

    get currentUserSessionInfo() {
        if (this.currentMarkingContext.currentQuizSessionId) {
        return this.$store.getters.quizSessionInfoMap[this.currentMarkingContext.currentQuizSessionId];
        }

        return null;
    }

    get username() {
        return (this.currentUserSessionInfo && this.currentUserSessionInfo.user && this.currentUserSessionInfo.user.username) || "";
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
                if(this.markingConfig && this.markingConfig.allowMultipleMarkers) {
                    // If multiple markers are enabled, find the mark for the current marker
                    marks = quizSessionIdMarks.find((mark) => mark.markerId === marker._id);
                } else {
                    // If multiple marking is not enabled, use the mark returned regardless of the marker
                    marks = quizSessionIdMarks[0];
                }
                if (!marks) throw new Error();

                // Marks were found, update quiz session marked map in store
                // This is done because if on initial load of chat groups, a user was not marked, but upon navigating to a user it is found that they were indeed marked,
                // the marking indicators (for user and group) need to be updated
                this.$store.commit("QUIZSESSION_MARKS", { quizSessionId: this.currentQuizSessionId, chatGroupId: this.currentChatGroupId, marked: true });

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
            criteriaId: value._id!,
            feedback: ""
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

    /**
     * Returns the chat group ID of the group that is currently being marked
     */
    get currentChatGroupId() {
       return this.$store.getters.currentChatGroup && this.$store.getters.currentChatGroup._id; 
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

            let markSaveResponse = null;

            if (multipleMarking) {
                markSaveResponse = await API.request(API.POST, API.MARKS +
                    `multiple/createOrUpdate/quizSessionId/${this.currentQuizSessionId}/questionId/${this.currentQuestionId}`, marksToBeSaved);
            } else {
                markSaveResponse = await API.request(API.POST, API.MARKS +
                    `createOrUpdate/quizSessionId/${this.currentQuizSessionId}/questionId/${this.currentQuestionId}`, marksToBeSaved);
            }

            if (markSaveResponse) {
                this.showSuccessMessage();

                // Update marking indicator map in group
                this.$store.commit("SET_QUIZSESSION_MARKED", { quizSessionId: this.currentQuizSessionId, marked: true, chatGroupId: this.currentChatGroupId });
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