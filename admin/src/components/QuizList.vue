<template>
    <div class="container">
        <h1 class="tcl-name">Quiz Sessions List</h1>
        <router-link tag="button"
                     class="primary"
                     to="/quizPage">Add Quiz</router-link>
        <v-container fluid grid-list-md>
            <v-layout row wrap>
                <v-flex v-for="quiz in quizzes"
                    :key="quiz._id"
                    xs12>
                    <v-card>
                        <v-card-title><h3>Quiz Title: {{quiz.title}}</h3></v-card-title>
                        <div class="date-text">
                            <span><b>ID: {{quiz._id}}</b></span>
                        </div>
                        <div class="date-text">
                            <span><b>Start Datetime:</b> {{quiz.availableStart.toLocaleString()}} - <b>End Datetime:</b> {{quiz.availableEnd.toLocaleString()}}</span>
                        </div>
                        <div class="controls">
                            <v-btn type="button"
                                    class="primary"
                                    @click="editQuiz(quiz._id)">Edit</v-btn>
                            <v-btn type="button"
                                    class="primary"
                                    @click="deleteQuiz(quiz._id)">Delete</v-btn>
                            <v-btn type="button"
                                    class="primary"
                                    @click="cloneQuiz(quiz._id)">Create copy</v-btn>
                        </div>
                    </v-card>
                </v-flex>
            </v-layout>
        </v-container>
    </div>
</template>

<style scoped>
.quiz {
    border-bottom: 1px solid black;
}

.date-text {
    display: flex;
    margin: 16px;
}

.controls {
    display: flex;
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { IQuiz } from "../../../common/interfaces/DBSchema";
import { EventBus, EventList, ModalEvent } from "../EventBus";
@Component({})
export default class QuizList extends Vue {
    private editQuiz(id: string) {
        this.$router.push("/quizPage?q=" + id);
    }

    private deleteQuiz(id: string) {
        const payload: ModalEvent = {
            message: `Are you sure to delete quiz with ID: ${id}`,
            title: "Deleting a quiz",
            fn: this.$store.dispatch,
            data: ["deleteQuiz", id]
        };
        EventBus.$emit(EventList.OPEN_MODAL, payload);
    }

    private cloneQuiz(id: string) {
        this.$router.push(`/quizPage?q=${id}&clone=1`);
    }

    get quizzes(): IQuiz[] {
        return this.$store.getters.quizzes;
    }
}
</script>
