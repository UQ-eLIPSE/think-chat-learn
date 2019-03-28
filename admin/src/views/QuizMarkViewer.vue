<template>
    <div v-if="allMarksArray && q && markingConfiguration"
         class="quiz-mark-viewer">
        <h1>Quiz marks</h1>
        <h3>{{ q.title }}</h3>
        <span>Timings: {{ new Date(q.availableStart).toString() }} - {{ new Date(q.availableEnd).toString() }}</span>

        <div class="controls">
            <label class="display-unmarked">Display unmarked students?
                <input type="checkbox"
                       v-model="displayUnmarkedStudents" /> </label>
            <button class="primary"
                    type="button"
                    @click="exportToCsv">Export marks to CSV</button>
        </div>
        <div class="stats">
            <!-- <span>Total student attempts: {{ totalAttempts }} </span>
                                    <div>
                                        <span>No. of marked students </span>
                                        <span v-if="hasMultipleMarkersEnabled">(marked by at least one staff member)</span>
                                        <span>{{ 15 }} </span>
                                    </div> -->
        </div>
        <table class="marks-table">
            <thead>
                <tr class="row-heading">
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
                <tbody :id="marksForQuestion[0].questionId"
                       class="question-row-group"
                       v-for="marksForQuestion in allMarksArray"
                       :key="marksForQuestion[0].questionId">
                    <tr>
                        <td colspan="100%">
                            <b>Question ID: {{marksForQuestion[0].questionId}}</b>
                        </td>
                    </tr>
                    <tr v-for="(m, x) in marksForQuestion"
                        :key="m.quizSessionId + marksForQuestion[0].questionId + x">
                        <td>{{ m.username }}</td>
                        <td>{{ m.questionId }}</td>
                        <td>{{ m.markerUsername }}</td>
                        <td v-for="(v, i) in Object.keys(m.mark.value)"
                            :key="m.quizSessionId + v + i">
                            {{ m.mark.value[v] }}
                        </td>
                    </tr>

                </tbody>
            </template>

            <template v-if="isElipssMark && unmarkedUserMap && displayUnmarkedStudents">
                <tbody>
                    <tr class="row-heading unmarked">
                        <td colspan="100%">
                            Unmarked
                        </td>
                    </tr>
                </tbody>

                <tbody v-for="(questionId, i) in orderedDiscussionPageQuestionIds"
                       :key="questionId + 'unmarked' + i">
                    <tr>
                        <td colspan="100%">
                            <b>Question ID: {{ questionId }}</b>
                        </td>
                    </tr>
                    <!-- For every question id, check the unmarkedMap -->
                    <tr v-for="(user, i) in unmarkedUserMap[questionId] || []"
                        :key="questionId + 'unmarked' + user._id || i">
                        <td>{{ user.username }}</td>
                        <td>{{ questionId }}</td>
                        <td colspan="100%">-</td>
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

    private allMarks: { [questionId: string]: { [quizSessionId: string]: Schema.ElipssMark[] } } = {};
    private displayUnmarkedStudents: boolean = true;

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

    get allMarksMap() {
        return this.allMarks;
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
    get unmarkedUserMap() {
        const unmarkedMap: { [questionId: string]: IUser[] } = {}
        const chatGroups: IChatGroup[] | undefined | null = this.$store.getters.chatGroups;
        if (!chatGroups || chatGroups.length === 0) return [];
        // For every chat group, check quiz session id is marked or not
        const quizSessionIds = chatGroups.reduce((combinedArr, chatGroup) => combinedArr.concat(chatGroup.quizSessionIds || []), [] as string[]);

        // Check for every question, whether a quizSessionId is unmarked
        this.orderedDiscussionPageQuestionIds.forEach((questionId) => {
            quizSessionIds.forEach((quizSessionId) => {
                // Now check if quiz session id exists in the allMarksMap
                if (this.allMarksMap[questionId]) {
                    if (this.allMarksMap[questionId][quizSessionId] && Array.isArray(this.allMarksMap[questionId][quizSessionId]) && this.allMarksMap[questionId][quizSessionId].length > 0) {
                        // Marked, go to next iteration
                        return;
                    }
                }
                // Push to unmarked as a catch-all
                if (!unmarkedMap[questionId]) unmarkedMap[questionId] = [];
                const user = this.getUserFromQuizSessionId(quizSessionId);
                if (!user) return;
                // Add username of user to the unmarked array
                unmarkedMap[questionId].push(user);

            });


        });


        return unmarkedMap;
    }
    get allMarksArray() {
        let marks: any[] = []
        const map = this.allMarksMap;
        const questionIds = Object.keys(map);
        questionIds.forEach((questionId) => {
            const quizSessionIds = Object.keys(map[questionId] || []);
            const marksArrayPerQuizSession: any[] = quizSessionIds.map((qid) => map[questionId][qid]);
            let marksArray: any[] = []
            marksArrayPerQuizSession.forEach((arr: Schema.ElipssMark[]) => {
                arr.forEach((m) => {
                    marksArray.push(m);
                })
            })
            marks.push(marksArray);
        });

        return marks;
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
        // vm.$store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuizId', value: vm.$route.params.id });

        // await vm.$store.dispatch("getChatGroups", vm.q._id);
        const chatGroups = vm.$store.getters.chatGroups;
        const chatGroupsInformationPromises = await Promise.all(chatGroups.map(async (g: IChatGroup) => {
            const chatGroupsQuizSessionPromises = Promise.all((g!.quizSessionIds || []).map(async (qs) => {

                const quizSessionIdMarks = await API.request(API.GET, API.MARKS + `quizSessionId/${qs}`, {});
                if (!quizSessionIdMarks) return;
                // push to map by question
                quizSessionIdMarks.forEach((m: Schema.ElipssMark) => {
                    if (!vm.allMarks[m.questionId]) Vue.set(vm.allMarks, m.questionId, {});
                    if (!vm.allMarks[m.questionId][m.quizSessionId]) Vue.set(vm.allMarks[m.questionId], m.quizSessionId, []);
                    const currentMarksArray = vm.allMarks[m.questionId][m.quizSessionId];
                    currentMarksArray.push(m);
                    Vue.set(vm.allMarks[m.questionId], m.quizSessionId, currentMarksArray);
                })
            }));
        }));

    }

    async created() {
        await this.fetchAllMarksForQuiz(this);
    }
    // async beforeRouteEnter(to: any, from: any, next: any) {
    //     next(async (vm: any) => {
    //         await vm.fetchAllMarksForQuiz(vm);

    //     });
    // }

    // async beforeRouteUpdate(to: any, from: any, next: any) {
    //   await this.fetchAllQuizSessionInfo(this);
    // }
    getOrderedMarkValuesArray(m: Schema.ElipssMark) {
        const markValues: string[] = [];
        this.elipssMarkHeadings.forEach((h: any) => {
            markValues.push(((m as any).mark.value[h] as number).toString());
        });
        return markValues;
    }
    exportToCsv() {
        const csvRowArray: string[] = [];

        const DELIMITER = ","

        // Push Header info
        const headRow = ["Username", "Question_ID", "Marked_By", ...this.elipssMarkHeadings].join(DELIMITER);
        csvRowArray.push(headRow);

        this.allMarksArray.forEach((marksPerQuestionArray) => {

            marksPerQuestionArray.forEach((m: Schema.ElipssMark) => {
                const csvRow: string[] = [];
                csvRow.push(m.username || 'NA', m.questionId || 'NA', m.markerUsername || 'NA', ...this.getOrderedMarkValuesArray(m))
                csvRowArray.push(csvRow.join(DELIMITER));
            })
        });

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
    justify-content: space-between;
}

.display-unmarked {
    font-weight: bold;
    font-size: 1.2em;
    margin: 0.5rem 0;
}
</style>