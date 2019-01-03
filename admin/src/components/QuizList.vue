<template>
    <div class="container">
        <h1 class="moochat-name">Quiz List</h1>
        <router-link tag="button" to="/quizPage">Add Quiz</router-link>
        <div v-for="quiz in quizzes" :key="quiz._id" class="quiz">
            <span>{{quiz.title}}</span>
            <button type="button" @click="editQuiz(quiz._id)">Edit</button>
            <button type="button" @click="deleteQuiz(quiz._id)">Delete</button>
        </div>
    </div>
</template>

<style scoped>
.quiz {
    border-bottom: 1px solid black;
}
</style>

<script lang="ts">
import {Vue, Component} from "vue-property-decorator";
import { IQuiz } from "../../../common/interfaces/DBSchema";
@Component({})
export default class QuizList extends Vue {
    private editQuiz(id: string) {
        this.$router.push("/quizPage?q=" + id);
    }

    private deleteQuiz(id: string) {
        this.$store.dispatch("deleteQuiz", id);
    }

    get quizzes(): IQuiz[] {
        return this.$store.getters.quizzes;
    }
}
</script>
