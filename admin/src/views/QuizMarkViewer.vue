<template>
    <div v-if="allMarksArray && q && markingConfiguration">
        <h1>Quiz marks</h1>
        <h3>{{ q.title }}</h3>
        <span>Timings: {{ new Date(q.availableStart).toString() }} - {{ new Date(q.availableEnd).toString() }}</span>
        <button class="primary"
                type="button"
                @click="exportToCsv">Export marks to CSV</button>
        <table class="marks-table">
            <thead>
                <tr>
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
                        <td colspan="100%">Question ID: {{marksForQuestion[0].questionId}}</td>
                    </tr>
                    <tr v-for="m in marksForQuestion"
                        :key="m.quizSessionId">
                        <td>{{ m.username }}</td>
                        <td>{{ m.questionId }}</td>
                        <td>{{ m.markerUsername }}</td>
                        <td v-for="v in Object.keys(m.mark.value)"
                            :key="m.quizSessionId + v">
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

    private allMarks: { [questionId: string]: { [quizSessionId: string]: Schema.ElipssMark[] } } = {};

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
    get allMarksArray() {
        console.log('Getting all marks array');
        let marks: any[] = []
        console.log(marks);
        // if(!this.allMarksMap || Object.keys(this.allMarksMap).length === 0) return [];
        const map = this.allMarksMap;
        console.log('Map: ', map);
        const questionIds = Object.keys(map);
        console.log('Question ids in map:', questionIds);
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
            console.log('Pushing marks ...');
            console.log(marksArray);
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
        vm.$store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuizId', value: vm.$route.params.id });

        await vm.$store.dispatch("getChatGroups", vm.q._id);
        const chatGroups = vm.$store.getters.chatGroups;
        const chatGroupsInformationPromises = await Promise.all(chatGroups.map(async (g: IChatGroup) => {
            const chatGroupsQuizSessionPromises = Promise.all((g!.quizSessionIds || []).map(async (qs) => {

                const quizSessionIdMarks = await API.request(API.GET, API.MARKS + `quizSessionId/${qs}`, {});
                console.log('Quiz session marks: ', quizSessionIdMarks);
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
        const headRow = ["No.", "Username", "Question_ID", "Marked_By", ...this.elipssMarkHeadings].join(DELIMITER);
        csvRowArray.push(headRow);
        let count = 0;

        this.allMarksArray.forEach((marksPerQuestionArray) => {

            marksPerQuestionArray.forEach((m: Schema.ElipssMark) => {
                const csvRow: string[] = [];
                csvRow.push( (++count).toString() ,m.username || '', m.questionId || '', m.markerUsername || '', ...this.getOrderedMarkValuesArray(m))
                csvRowArray.push(csvRow.join(DELIMITER));
            })
        });

        const csvFileContents = "data:text/csv;charset=utf-8," + csvRowArray.join("\n");
        
        console.log(csvFileContents)
        var encodedUri = encodeURI(csvFileContents);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${(this.q || { title: 'marks' }).title}_${Date.now().toString()}.csv`);
        document.body.appendChild(link); // Required for FF
        console.log(link);
        link.click();
    }
}
</script>
<style lang="scss" scoped>
@import "../../css/variables.scss";

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
</style>