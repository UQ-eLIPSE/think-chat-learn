<template>
    <div class="marking-section">
        <h1>
            Quiz list</h1>
        <ul class="marking">

            <router-link tag="li"
                         :to="{ name: 'mark-quiz', params: { id: q._id } }"
                         class="quiz-item"
                         v-for="q in quizzes"
                         :key="q._id">
                <span>Quiz ID: {{q._id}}</span>
                <span>Title: {{ q.title }}</span>
                <span>Available Start: {{ q.availableStart }}</span>
                <span>Available End: {{ q.availableEnd }}</span>
            </router-link>
            <router-view />
        </ul>
    </div>
</template>

<style scoped>
.marking, .marking-section {
    width: calc(90% - 18rem);
    height: 100%;
    display: flex;
    flex-direction: column;
}

.quiz-item {
    width: 100%;
    display: flex;
    flex-direction: column;
    border: 0.1rem solid rgba(1, 0, 0, 0.1);
    margin: 0.5rem 0;
    cursor: pointer;
}

.quiz-item:hover,
.quiz-item:active,
.quiz-item:focus {
    background: rgba(1, 0, 0, 0.1);
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
        return this.$store.state.Quiz.course || '';
    }

}
</script>
