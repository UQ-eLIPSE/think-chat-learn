<template>
    <div class="marking-section">
        <h1>
            Quiz Marks</h1>
        <ul class="marking container">

            <div class="quiz-item"
                 v-for="q in quizzes"
                 :key="q._id">

                <h3>{{ q.title }}</h3>
                <h5>Quiz ID: {{q._id}}</h5>
                <span><b>Available Start:</b> {{ new Date(q.availableStart).toLocaleString() }}</span>
                <span><b>Available End:</b> {{ new Date(q.availableEnd).toLocaleString() }}</span>

                <div class="controls">
                    <router-link tag="button"
                                 class="primary"
                                 :to="{ name: 'mark-quiz', params: { id: q._id } }">Start marking</router-link>
                    <router-link tag="button"
                                 id="view-marks"
                                 class="primary"
                                 :to="{ name: 'view-mark-quiz', params: { id: q._id } }">View marks</router-link>
                </div>
            </div>
            <!-- <router-view /> -->
        </ul>
    </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

.marking,
.marking-section {
    width: calc(90% - 18rem);
    height: 100%;
    display: flex;
    flex-direction: column;
}

.quiz-item {
    padding: 0.5rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    border: 0.1rem solid rgba(1, 0, 0, 0.1);
    margin: 0.5rem 0;
}

.controls {
    display: flex;
}

.controls>* {
    margin: 0 0.25rem;
}

.quiz-item:hover,
.quiz-item:active,
.quiz-item:focus {
    background: rgba(1, 0, 0, 0.05);
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page } from "../../../common/interfaces/ToClientData";

@Component({})
export default class Marking extends Vue {
    get quizzes(): IQuiz[] {
        return this.$store.getters.quizzes;
    }
    get course() {
        return this.$store.state.Quiz.course || "";
    }

}
</script>
