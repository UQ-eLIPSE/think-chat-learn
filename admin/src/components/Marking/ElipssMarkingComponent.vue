<template>
    <div class="marking-rubric">
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
                                v-if="currentMarksValue"
                               class="number-mark"
                               v-model="currentMarksValue[c]"
                               :value="m"/>
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
                                v-if="currentMarksValue"
                               class="number-mark"
                               v-model="currentMarksValue[c]"
                               :value="m"/>
                    </label>
                </td>
            </tr>

            </tr>
        </table>
        <label> Feedback
        <textarea v-if="currentMarksMark" v-model="currentMarksMark.feedbackText"></textarea></label>
        <button class="button"
                @click.prevent="saveMarks">Save</button>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage, IQuestionAnswerPage, QuizSessionDataObject } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import * as Schema from "../../../../common/interfaces/DBSchema";
import { API } from "../../../../common/js/DB_API";

Component.registerHooks([
  'beforeRouteEnter',
  'beforeRouteLeave',
  'beforeRouteUpdate' // for vue-router 2.2+
])

@Component({})
export default class ElipssMarkingComponent extends Vue {
    private marks: Schema.ElipssMark | undefined;

    get currentMarkingContext() {
        return this.$store.getters.currentMarkingContext;
    }

    // get marksMap() {
    //     return this.$store.getters.marksMap;
    // }

    // get marksInStoreMap() {
    //     if(!this.currentMarkingContext) return null;
    //     if(!this.currentMarkingContext.currentQuizSessionId || !this.$store.getters.quizSessionInfoMap) return null;
    //     if(!this.$store.getters.quizSessionInfoMap[this.currentMarkingContext.currentQuizSessionId]) return null;
    //     return this.$store.getters.quizSessionInfoMap[this.currentMarkingContext.currentQuizSessionId].marks;
    // }

    // get currentMarks() {
    //     if(!this.currentMarkingContext || !this.currentMarkingContext.currentMarks || !this.currentMarkingContext.currentQuestionId || !this.currentMarkingContext.currentMarks.questionMarks) return null;
    //     return this.currentMarkingContext.currentMarks
    // }

    // get currentMarksMark() {
    //     if(!this.currentMarkingContext || !this.currentMarkingContext.currentMarks || !this.currentMarkingContext.currentQuestionId || !this.currentMarkingContext.currentMarks.questionMarks) return null;
    //     return this.currentMarkingContext.currentMarks.questionMarks[this.currentMarkingContext.currentQuestionId].mark;
    // }
    // get currentMarksValue() {
    //     if(!this.currentMarkingContext || !this.currentMarkingContext.currentMarks || !this.currentMarkingContext.currentQuestionId || !this.currentMarkingContext.currentMarks.questionMarks) return null;
    //     return this.currentMarkingContext.currentMarks.questionMarks[this.currentMarkingContext.currentQuestionId].mark.value;
    // }
    // get marks() {
    //     if(!this.currentMarkingContext || !this.currentMarkingContext.currentQuizSessionId || !this.initElipssMarks()) return null;
    //     if(!this.marksInStoreMap) {
    //         if(!this.currentMarkingContext.currentMarks) {
    //             this.$store.commit("UPDATE_CURRENT_MARKING_CONTEXT", { prop: "currentMarks", value: this.initElipssMarks() });
    //         } else {
    //             return this.currentMarkingContext.currentMarks;
    //         }
    //     } else {
    //         this.$store.commit("UPDATE_CURRENT_MARKING_CONTEXT", { prop: "currentMarks", value: this.marksInStoreMap });
    //         return this.currentMarkingContext.currentMarks;
    //     } 
    // }

    async fetchMarksForQuestion() {
        try {
                const currentMarkingContext = this.currentMarkingContext;
                const quizSessionId = currentMarkingContext.currentQuestionId;
                const questionId = currentMarkingContext.currentQuestionId;
                const quizSessionIdMarks = await API.request(API.GET, API.MARKS + `/quizSessionId/${quizSessionId}/questionId/${questionId}`, {});
                const marker = this.marker;
                let marks: any = null;
                if(Array.isArray(quizSessionIdMarks)) {
                    marks = quizSessionIdMarks.find((mark) => mark.markerId === marker._id)
                    if(!marks) throw new Error();
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
        const quizSessionId = currentMarkingContext.currentQuestionId;
        const questionId = currentMarkingContext.currentQuestionId;
        const currentQuizSessionInfoObject = this.$store.getters.currentQuizSessionInfoObject;
        const marker = this.marker;
        return {
            type: Schema.MarkMode.ELIPSS_MARKING,
            questionId: questionId,
            quizSessionId: quizSessionId,
            markerId: marker._id,
            userId: currentQuizSessionInfoObject.user._id,
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
    async beforeRouteEnter(to: any, from: any, next: any) {
        next(async(vm: any) => {
        })
    }
 
    get markingContext() {
        return this.$store.getters.currentMarkingContext;
    }
    get currentQuestionId() {
        if (!this.markingContext) return undefined;
        return this.markingContext.currentQuestionId;
    }


    initElipssMarks(): Schema.ElipssMark | null {
        if(!this.currentMarkingContext || !this.currentMarkingContext.currentQuizSessionId || !this.$store.getters.currentQuizSessionInfoObject) return null;
        const m = {
            type: Schema.MarkMode.ELIPSS_MARKING as any,
            quizSessionId: this.currentMarkingContext.currentQuizSessionId,
            userId: this.$store.getters.currentQuizSessionInfoObject.user._id,
            questionMarks: {
                [this.currentQuestionId]: this.initElipssMark()
            }
        }
        console.log(m);
        return m;
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
    get markingConfig() {
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

    saveMarks() {
        if(!this.marks) return;

        // const marksToBeSaved: Schema.ElipssMark = Object.assign({}, this.marks);

        // // Update marks metadata
        // // Get current question ID
        // const markerId = this.marker.username;
        // const timestamp = Date.now();
        // const currentQuestionId = this.currentMarkingContext.currentQuestionId;
        // // We assume feedback text and
        // marksToBeSaved.questionMarks[currentQuestionId].mark.markerId = markerId;
        // marksToBeSaved.questionMarks[currentQuestionId].mark.timestamp = timestamp as any;
        
        console.log('Saving these marks: ', this.marks);
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