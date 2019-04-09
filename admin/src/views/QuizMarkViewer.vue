<template>
    <div v-if="marksArray && q && markingConfiguration"
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

            <button class="primary"
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
                    <td>Question ID</td>
                    <td>Marked by</td>
                    <template v-if="isElipssMark">
                        <td :key="v"
                            v-for="v in elipssMarkHeadings">{{ v }}</td>
                    </template>
                    <template v-if="isSimpleMark">
                        <td :key="v"
                            v-for="v in elipssMarkHeadings"></td>
                    </template>

                </tr>
            </thead>
            <template v-if="isElipssMark">

                <tbody v-for="(marksForQuizSession, y) in marksArray"
                       :id="marksForQuizSession.quizSessionId + y.toString()"
                       :key="marksForQuizSession.quizSessionId"
                       class="question-row-group">

                    <tr class="question-id-row">
                        <td>{{ y + 1 }}</td>
                        <td colspan="100%">
                            Username: {{ marksForQuizSession[0].username }}
                        </td>
                    </tr>
                    <tr v-for="(m, x) in marksForQuizSession"
                        :class="getMarkRowClass(m)"
                        :key="m.quizSessionId + marksForQuizSession[0].questionId + x">
                        <td></td>
                        <td>{{ (m || { username: 'NA'}).username || 'x' }}</td>
                        <td>{{ m.questionId }}</td>
                        <td>{{ m.markerUsername }}</td>
                        <td v-for="(v, i) in Object.keys(m.mark.value)"
                            :key="m.quizSessionId + v + i">
                            {{ m.mark.value[v] }}
                        </td>
                    </tr>
                </tbody>
            </template>
        </table>

    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage, IQuestionAnswerPage, IQuizSession, IChatGroup, IUserSession, IUser, QuizSessionDataObject } from "../../../common/interfaces/ToClientData";
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
    private marksMap: { [quizSessionId: string]: { [questionId: string]: Schema.ElipssMark[] } } = {};
    private quizSessionUserMap: { [quizSessionId: string]: { userSessionId: string, user: IUser } } = {};
    // private allMarks: { [questionId: string]: { [quizSessionId: string]: Schema.ElipssMark[] } } = {};
    private numberOfPaginationPerPageValues: number[] = [5, 10, 25, 50, 100];
    private pagination: {
        total: number, perPage: number, currentPage: number
    } = {
        total: 0,
        perPage: this.numberOfPaginationPerPageValues[0],
        currentPage: 1
    };

    getMarkRowClass(mark: Schema.ElipssMark | Schema.SimpleMark) {
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
    get emptyElipssMarkValues() {
        return {
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

    isMarked(markObject: Schema.ElipssMark | Schema.SimpleMark) {
        if (markObject.type === Schema.MarkMode.ELIPSS_MARKING) {
            return markObject.markerUsername && markObject.userId && markObject.username && markObject.quizSessionId;
        } else if (markObject.type === Schema.MarkMode.SIMPLE_MARKING) {
            // TODO: Complete for simple marking, return false for now
            return false;
        }

    }

    get orderedDiscussionPageQuestionIds() {
        if (!this.q || !this.q.pages) return [];
        const discussionPages = this.q.pages.filter((p) => p.type === PageType.DISCUSSION_PAGE);
        const discussionPageQuestionIds = discussionPages.map((p) => (p as IDiscussionPage).questionId);
        return discussionPageQuestionIds;
    }

    getUserFromQuizSessionId(quizSessionId: string): IUser | null {
        const quizSessionInfoMap = this.$store.getters.quizSessionInfoMap;
        if (!quizSessionInfoMap) return null;
        if (quizSessionInfoMap[quizSessionId] && quizSessionInfoMap[quizSessionId].user) {
            return quizSessionInfoMap[quizSessionId].user;
        }

        // Return null by default
        return null;

    }

    getEmptyMarkForUserByMarkType(quizSessionId: string, questionId: string, username: string, userId: string): Schema.ElipssMark | Schema.SimpleMark | null {
        if (this.isElipssMark) {
            return {
                type: Schema.MarkMode.ELIPSS_MARKING,
                questionId: questionId,
                quizSessionId: quizSessionId,
                markerId: null,
                userId: userId,
                username: username,
                markerUsername: undefined,
                timestamp: null,
                quizId: null,
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
        } else {
            // TODO: Generate empty mark for simple marking
            // Return null for now
            return null;
        }
    }

    generateMarksArrayForMap(map: { [quizSessionId: string]: { [questionId: string]: Schema.Mark[] } }, quizSessionUserMap: {[quizSessionId: string]: {userSessionId: string, user: IUser}}) {
        let marks: Schema.Mark[][] = [];
        if (Object.keys(quizSessionUserMap).length === 0) return marks;
        const quizSessionIds = Object.keys(map);

        quizSessionIds.forEach((quizSessionId) => {
            let quizSessionMarks: Schema.Mark[] = []
            const marksArrayPerQuestion = Object.keys(map[quizSessionId]);

            marksArrayPerQuestion.forEach((questionId) => {
                if (!map[quizSessionId][questionId] || map[quizSessionId][questionId].length === 0) {
                    // Push empty mark
                    const username = (quizSessionUserMap[quizSessionId].user || { username: 'NA' }).username || 'NA';
                    const userId = (quizSessionUserMap[quizSessionId].user || { _id: 'NA' })._id || 'NA';
                    console.log('Mark does not exist for quiz session: ', quizSessionId);
                    const emptyMark = this.getEmptyMarkForUserByMarkType(quizSessionId, questionId, username, userId);
                    if (emptyMark) quizSessionMarks.push(emptyMark);
                } else {
                    quizSessionMarks.push(...map[quizSessionId][questionId]);
                }


            })
            marks.push(quizSessionMarks);
        });

        return marks;
    }
    get marksArray() {
        const map = this.marksMap;
        const quizSessionUserMap = this.quizSessionUserMap;
        return this.generateMarksArrayForMap(map, quizSessionUserMap);
    }

    get elipssMarkHeadings() {
        return Object.keys(this.emptyElipssMarkValues.value);
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

    get isElipssMark() {
        if (!this.q || !this.q.markingConfiguration) return false;
        return this.q.markingConfiguration.type === Schema.MarkMode.ELIPSS_MARKING;
    }

    get isSimpleMark() {
        if (!this.q || !this.q.markingConfiguration) return false;
        return this.q.markingConfiguration.type === Schema.MarkMode.SIMPLE_MARKING;
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

    getOrderedMarkValuesArray(m: Schema.ElipssMark | any) {
        const markValues: string[] = [];
        const valueObject = this.emptyElipssMarkValues.value;
        this.elipssMarkHeadings.forEach((h) => {
            const v: any = m.mark.value[h] ? (m.mark.value[h as any] as number).toString() : '-'
            markValues.push(v)
        });
        return markValues;
    }

    async exportToCsv() {
        const { totalQuizSessions, marksMap, quizSessionUserMap } = await API.request(API.GET, API.MARKS + `bulk/quiz?q=${this.$route.params.id}&c=1&p=${Number.MAX_SAFE_INTEGER}`, {})
 

        const csvRowArray: string[] = [];

        const DELIMITER = ","

        // Push Header info
        const headRow = ["Username", "Question_ID", "Marked_By", ...this.elipssMarkHeadings].join(DELIMITER);
        csvRowArray.push(headRow);

        const marksArray = this.generateMarksArrayForMap(marksMap, quizSessionUserMap)
        marksArray.forEach((quizSessionMarksArray) => {
            quizSessionMarksArray.forEach((m: Schema.Mark) => {
                const csvRow: string[] = [];
                if (m.type === Schema.MarkMode.ELIPSS_MARKING) {
                    csvRow.push(m.username || 'NA', m.questionId || 'NA', m.markerUsername || 'NA', ...this.getOrderedMarkValuesArray(m as Schema.ElipssMark))
                }
                if (m.type === Schema.MarkMode.SIMPLE_MARKING) {
                    // TODO: Add marks for simple marking
                }
                csvRowArray.push(csvRow.join(DELIMITER));
            })
        })

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
@import "../../css/variables.scss";
.pagination {
    margin: 1rem 0;
}

.quiz-mark-viewer {
    padding: 2rem;
}

.marks-table {
    border-collapse: collapse;
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