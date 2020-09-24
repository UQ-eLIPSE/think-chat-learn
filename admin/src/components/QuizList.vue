<template>
    <div class="container">
        <h1 class="moochat-name">Quiz Sessions List</h1>
        <router-link tag="button"
                     class="primary-cl"
                     to="/quizPage">Add Quiz</router-link>
        <v-container fluid grid-list-md>
            <v-layout row wrap>
                <v-flex v-for="quiz in quizzes"
                    :key="quiz._id"
                    xs12>
                    <div class='card-container quiz-card'>
                        <v-card-title>
                            <h3>Quiz Title: {{quiz.title}}</h3>
                            <div class="visibility" :class="getVisibilityClasses(quiz)">{{ quiz.isPublic? 'PUBLIC':'STAFF ONLY' }}</div>
                        </v-card-title>
                        <div class="date-text">
                            <span><b>ID: {{quiz._id}}</b></span>
                        </div>
                        <div class="date-text">
                            <span><b>Start Datetime:</b> {{quiz.availableStart.toLocaleString()}} - <b>End Datetime:</b> {{quiz.availableEnd.toLocaleString()}}</span>
                        </div>
                        <div class="controls">
                            <button type="button"
                                    class="primary-cl button-cs"
                                    @click="editQuiz(quiz._id)">Edit</button>
                            <button type="button"
                                    class="uq button-cs"
                                    @click="deleteQuiz(quiz._id)">Delete</button>
                            <button type="button"
                                    class="purple-cl button-cs"
                                    @click="cloneQuiz(quiz._id)">Create copy</button>
                        </div>
                    </div>
                </v-flex>
            </v-layout>
        </v-container>
    </div>
</template>

<style scoped lang="scss">
@import "../../css/app.scss";

.quiz {
    border-bottom: 1px solid $black;
}

.date-text {
    display: flex;
    margin: 16px;
}

.controls {
    display: flex;
}

.visibility {
    position: absolute;
    right: 0;
    top: 0;
    padding: 0.25rem;
    font-size: 0.7em;
    font-weight: bold;
    text-transform: uppercase;
    border: 0.01em solid transparent;
}

.visibility-public {
    color: #155724;
    background-color: #d4edda;
    border-color: #c3e6cb;
}

.visibility-private {
    color: #721c24;
    background-color: #f8d7da;
    border-color: #f5c6cb;
}

.quiz-card {
    position: relative;
}


button {
    margin-right: 0.5rem;
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

    getVisibilityClasses(quiz: IQuiz) {
        if(!quiz) return {};
        return {
            'visibility-public': quiz.isPublic,
            'visibility-private': !quiz.isPublic

        }
    }
}
</script>
