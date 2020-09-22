<template>
    <!--  v-if="marksArray && q && markingConfiguration" -->
    <div
        v-if="q && markingConfiguration"
        class="quiz-mark-viewer">
        <h1>Quiz marks</h1>
        <h3>{{ q.title }}</h3>
        <span>Timings: {{ new Date(q.availableStart).toString() }} - {{ new Date(q.availableEnd).toString() }}</span>

        <div class="controls">

            <b-field label="Items per page">
                <b-select v-model="pagination.perPage">
                    <option v-for="numPerPage in numberOfPaginationPerPageValues"
                            :key="numPerPage"
                            :value="numPerPage">{{ numPerPage }} students</option>
                </b-select>
            </b-field>

            <button class="green-cl"
                    type="button"
                    @click="exportToCsv">Export marks to CSV</button>
        </div>
        <div class="stats">
            <span v-if="pagination.total">Total student attempts: {{ pagination.total }} </span>

            <b-pagination class="pagination"
                          :total="pagination.total"
                          :current.sync="pagination.currentPage"
                          order="is-centered"
                          size="is-medium"
                          :simple="false"
                          :rounded="true"
                          :per-page="pagination.perPage">
            </b-pagination>
        </div>
        <table class="marks-table">
            <thead>
                <tr class="row-heading">
                    <td>#</td>
                    <td>Username</td>
                    <td>Marked by</td>
                    <template>
                        <td :key="v"
                            v-for="v in criteriaHeadings">{{ v }}</td>
                    </template>
                </tr>
            </thead>
            <template>
                <tbody v-for="(marksForQuizSession, y, index) in marksMap"
                       :id="y"
                       :key="y"
                       class="question-row-group">

                    <tr class="question-id-row">
                        <td>{{ ((pagination.currentPage-1) * pagination.perPage) + (index + 1) }}</td>
                        <td colspan="100%">
                            Username: {{ marksForQuizSession[0].username }}
                        </td>
                    </tr>
                    <tr v-for="(m, x) in marksForQuizSession"
                        :class="getMarkRowClass(m)"
                        :key="m.quizSessionId + marksForQuizSession[0].questionId + x">
                        <td></td>
                        <!-- Username shouldn't be nully but markedUser could due to padding -->
                        <td>{{ (m || { username: 'NA'}).username || 'x' }}</td>
                        <td v-if="m.markerUsername">{{ m.markerUsername }}</td>
                        <td v-for="(mark, index) in m.marks"
                            :key="m.quizSessionId + index">
                            {{ mark.value }}
                        </td>
                    </tr>
                </tbody>
            </template>
        </table>    
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage, IQuestionAnswerPage,
    IQuizSession, IChatGroup, IUserSession, IUser,
    QuizSessionDataObject } from "../../../common/interfaces/ToClientData";
import * as Schema from "../../../common/interfaces/DBSchema";
import { PageType } from "../../../common/enums/DBEnums";
import MarkQuizMarkingSection from '../components/Marking/MarkQuizMarkingSection.vue';
import { API } from "../../../common/js/DB_API";

Component.registerHooks([
    'beforeRouteEnter',
    'beforeRouteLeave',
    'beforeRouteUpdate' // for vue-router 2.2+
])

@Component({
    components: {
        MarkQuizMarkingSection
    }
})
export default class QuizMarkViewer extends Vue {
    private marksMap: { [quizSessionId: string]: Schema.Mark[] } = {};
    private quizSessionUserMap: { [quizSessionId: string]: { userSessionId: string, user: IUser } } = {};

    private numberOfPaginationPerPageValues: number[] = [5, 10, 25, 50, 100];
    private pagination: {
        total: number, perPage: number, currentPage: number
    } = {
        total: 0,
        perPage: this.numberOfPaginationPerPageValues[0],
        currentPage: 1
    };

    getMarkRowClass(mark: Schema.Mark) {
        const marked = this.isMarked(mark);
        return {
            'marked': marked,
            'unmarked': !marked
        }
    }
    async fetchAndUpdatePaginatedMarksForQuiz(vm: any) {
        const currentQuizSessionKeys = Object.keys(vm.marksMap);
        currentQuizSessionKeys.forEach((q) => {
            Vue.delete(vm.marksMap, q)
            Vue.delete(vm.quizSessionUserMap, q);
        })
        const { totalQuizSessions, marksMap, quizSessionUserMap } = await API.request(API.GET, API.MARKS + `bulk/quiz?q=${vm.$route.params.id}&c=${vm.pagination.currentPage}&p=${vm.pagination.perPage}`, {})
        const quizSessionIds = Object.keys(marksMap);
        vm.pagination.total = totalQuizSessions;
        vm.marksMap = marksMap;
        vm.quizSessionUserMap = quizSessionUserMap;
    }

    @Watch('pagination.currentPage')
    async pageChangeHandler() {
        await this.fetchAndUpdatePaginatedMarksForQuiz(this);
    }

    @Watch('pagination.perPage')
    async perPageChangeHandler() {
        this.pagination.currentPage = 1;
        await this.fetchAndUpdatePaginatedMarksForQuiz(this);

    }

    get hasMultipleMarkersEnabled() {
        if (!this.q || !this.q.markingConfiguration) return false;
        return this.q.markingConfiguration.allowMultipleMarkers;
    }

    isMarked(markObject: Schema.Mark) {
        return markObject.markerUsername && markObject.userId && markObject.username && markObject.quizSessionId;
    }

    get orderedDiscussionPageQuestionIds() {
        if (!this.q || !this.q.pages) return [];
        const discussionPages = this.q.pages.filter((p) => p.type === PageType.DISCUSSION_PAGE);
        const discussionPageQuestionIds = discussionPages.map((p) => (p as IDiscussionPage).questionId);
        return discussionPageQuestionIds;
    }

    getEmptyMarkForUser(quizSessionId: string, username: string, userId: string): Schema.Mark {
        return {
            marks: [],
            feedback: "",
            quizSessionId,
            markerId: null,
            userId: userId,
            username: username,
            markerUsername: undefined,
            timestamp: null,
            quizId: null,            
        };
    }

    get rubrics(): Schema.IRubric[] {
        return this.$store.getters.rubrics;
    }

    get associatedRubric(): Schema.IRubric | undefined {
        if (this.q && this.q != undefined) {
            return this.rubrics.find((rubric) => {
                return rubric._id === this.q!.rubricId;
            });
        } else {
            return undefined;
        }
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

    get criteriaHeadings() {
        return this.associatedCriterias.reduce((arr: string[], value) => {
            arr.push(value.name);
            return arr;
        }, []);
    }

    get chatGroups() {
        return this.$store.state.Quiz.chatGroups || [];
    }

    get markingConfiguration() {
        if (!this.q) return null;
        return this.q.markingConfiguration;
    }
    get q() {
        if (!this.$route.params.id) return null;
        return this.quizzes.find((q) => q._id === this.$route.params.id);
    }
    get quizzes(): IQuiz[] {
        return this.$store.getters.quizzes || [];
    }

    async fetchAllMarksForQuiz(vm: any) {
        if (!vm.$route.params.id) return;
        vm.$store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuizId', value: vm.$route.params.id });

        // Fetch chat groups for quiz id
        await vm.$store.dispatch("getChatGroups", vm.q._id);

        const chatGroups = vm.$store.getters.chatGroups as IChatGroup[];

        await vm.fetchAndUpdatePaginatedMarksForQuiz(vm);

    }

    async created() {
        await this.fetchAllMarksForQuiz(this);
    }

    getOrderedMarkValuesArray(m: Schema.Mark): string[] {
        if (m) {
            const markValues: string[] = [];

            // For each criteria, fetch the mark or - if there is none
            return this.associatedCriterias.reduce((arr: string[], criteria) => {
                const markIndex = m.marks.findIndex((mark) => {
                    return mark.criteriaId === criteria._id;
                });

                // Acquire the mark and push it. If the index is invalid, place a - instead
                if (markIndex !== -1) {
                    arr.push(m.marks[markIndex].value!.toString());
                } else {
                    arr.push('-');
                }
                return arr;
            }, []);
        } else {
            return [];
        }
    }


    // TODO: Add types for maps
    populateMarksRows(csvRowArray: string[], DELIMITER: string, marksMap: { [key: string]: Schema.Mark[] }) {
        // Push Header info
        const headRow = ["Username", "Marked_By", ...this.criteriaHeadings].join(DELIMITER);
        csvRowArray.push(headRow);

        Object.keys(marksMap).forEach((key) => {
            const marksArr = marksMap[key];
            marksArr.forEach((mark) => {
                const csvRow: string[] = [];
                csvRow.push(mark.username || 'N/A',
                    mark.markerUsername || 'N/A',
                    ...this.getOrderedMarkValuesArray(mark));
                csvRowArray.push(csvRow.join(DELIMITER));
                // For each marker, 
            });

        });

    }

    async exportToCsv() {
        const { totalQuizSessions, marksMap, quizSessionUserMap } : {
            totalQuizSessions: any,
            marksMap: { [key: string]: Schema.Mark[] },
            quizSessionUserMap: any
        } = await API.request(API.GET, API.MARKS + `bulk/quiz?q=${this.$route.params.id}&c=1&p=${Number.MAX_SAFE_INTEGER}`, {})

        const DELIMITER = ","

        const csvRowArray: string[] = [];
        if (!this.markingConfiguration) return;

        this.populateMarksRows(csvRowArray, DELIMITER, marksMap);
        const csvFileContents = "data:text/csv;charset=utf-8," + csvRowArray.join("\n");

        var encodedUri = encodeURI(csvFileContents);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${(this.q || { title: 'marks' }).title}_${Date.now().toString()}.csv`);
        document.body.appendChild(link); // Required for FF
        link.click();
    }
}
</script>
<style lang="scss" scoped>
@import "../../css/app.scss";
.pagination {
    margin: 1rem 0;
}

.quiz-mark-viewer {
    padding: 2rem;
}

.marks-table {
    border-collapse: collapse;
    width: 100%;
}

.marks-table td,
.marks-table th {
    border: 1px solid #ddd;
    padding: 8px;
}

.question-row-group {
    margin: 0.5rem 0;
}

.row-heading {
    font-weight: bold;
    padding: 0.25rem 0;
    background-color: rgba(1, 0, 0, 0.1);
}

.row-heading.unmarked {
    padding: 0.1rem 0;
    background-color: lightcoral;
}

.controls {
    display: flex;
    justify-content: space-around;
    padding: 1rem;
}

.question-id-row {
    background: rgba(1, 1, 1, 0.03);
}

.marked {
    background: rgba(25, 200, 25, 0.2);
}

.unmarked {
    background: rgba(200, 25, 25, 0.2);
}
</style>