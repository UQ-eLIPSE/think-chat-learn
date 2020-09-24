<template>
    <v-container>
    <div class="marking-section">
        <h1>
            Quiz Marks</h1>
        <ul class="marking container">

            <div class="card-container quiz-item"
                 v-for="q in quizzes"
                 :key="q._id">

                <h3>{{ q.title }}</h3>
                <h5>Quiz ID: {{q._id}}</h5>
                <span><b>Available Start:</b> {{ new Date(q.availableStart).toLocaleString() }}</span>
                <span><b>Available End:</b> {{ new Date(q.availableEnd).toLocaleString() }}</span>

                <div class="controls">
                    <router-link tag="button" class="primary-cl button-cs"
                                 :to="{ name: 'mark-quiz', params: { id: q._id } }">Start marking</router-link>
                    <router-link tag="button" class="uq button-cs"
                                 id="view-marks"
                                 :to="{ name: 'view-mark-quiz', params: { id: q._id } }">View marks</router-link>
                </div>
            </div>
            <!-- <router-view /> -->
        </ul>
    </div>
    </v-container>
</template>

<style lang="scss" scoped>
@import "../../css/app.scss";

.marking,
.marking-section {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.quiz-item {
    display: flex;
    flex-direction: column;
}

.controls {
    margin-top: 2rem;
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
        return this.$store.state.Quiz.course || '';
    }

}
</script>
