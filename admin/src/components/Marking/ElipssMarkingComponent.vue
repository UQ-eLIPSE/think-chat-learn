<template>
    <div class="marking-rubric"
         v-if="quiz.markingConfiguration">
        <table class="marks-table">
            <tr>Individual Mark</tr>
            <tr v-for="c in individualCategories"
                class="values-row"
                :key="c">

                <td class="category-data"> {{c}}</td>

                <td v-for="m in possibleMarkValues"
                    :key="m">
                    <label> {{ m }}
                        <input type="radio"
                               class="number-mark"
                               :value="m"
                               @change="setMark(m, c)"
                               :name="c" />
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
                               class="number-mark"
                               :value="m"
                               @change="setMark(m, c)"
                               :name="c" />
                    </label>
                </td>
            </tr>

            </tr>
        </table>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage, IQuestionAnswerPage, QuizSessionDataObject } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import * as Schema from "../../../../common/interfaces/DBSchema";

@Component({})
export default class ElipssMarkingComponent extends Vue {
    @Prop({ required: true, default: () => { } }) private quiz: IQuiz | undefined;
    @Prop({ required: true, default: () => { } }) private currentQuizSession: QuizSessionDataObject | undefined
    @Prop({ required: true, default: () => null }) private question: IQuestionAnswerPage | undefined;
    // private mark: Schema.ElipssMark | Schema.SimpleMark = 
    get isElipssMark() {
        if (!this.quiz || !this.quiz.markingConfiguration) return false;
        return this.quiz.markingConfiguration.type === Schema.MarkMode.ELIPSS_MARKING;
    }

    get isSimpleMark() {
        if (!this.quiz || !this.quiz.markingConfiguration) return false;
        return this.quiz.markingConfiguration.type === Schema.MarkMode.SIMPLE_MARKING;
    }

    get mark(): Schema.ElipssMarkValue["mark"] | null {
        if (!this.currentQuizSession || !this.question || !this.currentQuizSession!.marks || !this.currentQuizSession!.marks.questionMarks) return null;
        return this.currentQuizSession!.marks!.questionMarks![this.question!.questionId!].mark;
    }

    get categories() {
        if (!this.mark) return [];

        return Object.keys(this.mark!.value)
    }

    setMark(m: any, c: string) {
        if (!this.mark || !this.mark.value) return;
        Vue.set(this.mark.value, `${c}`, m);
    }
    initElipssMarks(): Schema.ElipssMark {
        return {
            type: Schema.MarkMode.ELIPSS_MARKING,
            quizSessionId: this.currentQuizSession!.quizSession!._id!,
            user: this.currentQuizSession!.user!,
            questionMarks: {
                [this.question!.questionId]: this.initElipssMark()
            }
        }
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

    initElipssMark(): Schema.ElipssMarkValue {
        return {
            mark: {
                value: {
                    evaluating: null,
                    interpreting: null,
                    analysing: null,
                    makingArguments: null,
                    accuracyOfArgument: null,
                    expressingAndResponding: null,
                    depthOfReflection: null,
                },
                feedbackText: '',
                markerId: null,
                timestamp: null
            }
        }
    }

    get possibleMarkValues() {
        if (!this.quiz || !this.quiz.markingConfiguration) {
            return [];
        } else {
            return new Array(this.quiz.markingConfiguration.maximumMarks).fill(0).map((m, i) => i + 1);
        }
    }


    created() {
        if (!this.currentQuizSession || !this.question) { console.log('something wong'); return; }
        if (!this.currentQuizSession.marks) {
            this.currentQuizSession.marks = this.initElipssMarks();
            console.log('Current quiz session marks');
            console.log(this.currentQuizSession.marks);

        }
        if (!this.currentQuizSession.marks!.questionMarks[this.question.questionId]) {
            this.currentQuizSession.marks!.questionMarks![this.question.questionId] = this.initElipssMark();
        }
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
</style>