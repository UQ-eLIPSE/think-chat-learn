<template>
    <div class="marking-rubric"
         v-if="quiz.markingConfiguration">
        <select v-model="simpleMarkValue">
            <option :value="b"
                    v-for="b in markBoxes"
                    :key="b">{{ b }}</option>
        </select>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage, IQuestionAnswerPage, QuizSessionDataObject } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import * as Schema from "../../../../common/interfaces/DBSchema";

@Component({})
export default class MarkingComponent extends Vue {
    @Prop({ required: true, default: () => { } }) private quiz: IQuiz | undefined;
    @Prop({ required: true, default: () => { } }) private currentQuizSession: QuizSessionDataObject | undefined

    // private mark: Schema.ElipssMark | Schema.SimpleMark = 
    get isElipssMark() {
        if (!this.quiz || !this.quiz.markingConfiguration) return false;
        return this.quiz.markingConfiguration.type === Schema.MarkMode.ELIPSS_MARKING;
    }

    get markBoxes() {
        if (!this.quiz || !this.quiz.markingConfiguration) return 0;
        return new Array(this.quiz.markingConfiguration.maximumMarks + 1).map((_, i) => i);
    }
    get isSimpleMark() {
        if (!this.quiz || !this.quiz.markingConfiguration) return false;
        return this.quiz.markingConfiguration.type === Schema.MarkMode.SIMPLE_MARKING;
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
</style>