<template>
  <v-app id="app">
    <h1>MoocChat Intermediate Page</h1>
    <template v-if="quiz">
      <h2>Quiz Title: {{quiz.title}}</h2>
      <h3>Available Start: {{startDateString}} -
        Available End: {{endDateString}}</h3>
    </template>
    <v-content class="content-container">
      <router-view class="router-panel" />
    </v-content>    
  </v-app>
</template>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { getIdToken, getLoginResponse } from "../../common/js/front_end_auth";
import { IQuiz } from "../../common/interfaces/ToClientData";

@Component({})
export default class App extends Vue {
  get quiz(): IQuiz | null {
    return this.$store.getters.quiz;
  }

  get startDateString(): string {
    if (this.quiz && this.quiz.availableStart) {
      // Set seconds mutates
      const tempDate = (new Date(this.quiz.availableStart));
      tempDate.setSeconds(0, 0);
      return tempDate.toLocaleString();
    }

    return "N/A";
  }

  get endDateString(): string {
    if (this.quiz && this.quiz.availableEnd) {
      // Set seconds mutates
      const tempDate = (new Date(this.quiz.availableEnd));
      tempDate.setSeconds(0, 0);
      return tempDate.toLocaleString();
    }

    return "N/A";
  }
}
</script>
