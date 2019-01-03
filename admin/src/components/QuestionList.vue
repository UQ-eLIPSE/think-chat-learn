<template>
    <div class="container">
        <h1 class="moochat-name">Question List</h1>
        <router-link tag="button" to="/questionPage">Add Question</router-link>
        <div v-for="question in questions" :key="question._id" class="question">
            <span>{{question.title}}</span>
            <button type="button" @click="editQuestion(question._id)">Edit</button>
            <button type="button" @click="deleteQuestion(question._id)">Delete</button>
        </div>
    </div>
</template>

<style scoped>
.question {
    border-bottom: 1px solid black;
}
</style>

<script lang="ts">
import {Vue, Component} from "vue-property-decorator";
import { IQuestion } from "../../../common/interfaces/DBSchema";
@Component({})
export default class QuestionList extends Vue {
    private editQuestion(id: string) {
        this.$router.push("/questionPage?q=" + id);
    }

    private deleteQuestion(id: string) {
        this.$store.dispatch("deleteQuestion", id);
    }

    get questions(): IQuestion[] {
        return this.$store.getters.questions;
    }
}
</script>
