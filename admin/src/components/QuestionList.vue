<template>
    <div class="container">
        <h1>Question List</h1>
        <router-link tag="button" class="primary" to="/questionPage">Add Question</router-link>
        <v-container fluid grid-list-md>
            <v-layout row wrap>
                <v-flex v-for="question in questions"
                    :key="question._id"
                    xs12>
                    <v-card>
                        <v-card-title><h3>Question Title: {{question.title}}</h3></v-card-title>
                        <div class="controls">
                            <v-btn type="button"
                                    class="primary"
                                    @click="editQuestion(question._id)">Edit</v-btn>
                            <v-btn type="button"
                                    class="primary"
                                    @click="deleteQuestion(question._id)">Delete</v-btn>
                        </div>
                    </v-card>
                </v-flex>
            </v-layout>
        </v-container>
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
import { EventBus, EventList, ModalEvent } from "../EventBus";

@Component({})
export default class QuestionList extends Vue {
    private editQuestion(id: string) {
        this.$router.push("/questionPage?q=" + id);
    }

    private deleteQuestion(id: string) {
        const payload: ModalEvent = {
            message: `Are you sure to delete question with ID: ${id}`,
            title: "Deleting a question",
            fn: this.$store.dispatch,
            data: ["deleteQuestion", id]
        };
        EventBus.$emit(EventList.OPEN_MODAL, payload);
    }

    get questions(): IQuestion[] {
        return this.$store.getters.questions;
    }
}
</script>
