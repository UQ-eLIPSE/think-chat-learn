<template>
  <v-app class="pa-3" id="app">
    <h1 class="display-1">Think.Chat.Learn Backup Client</h1>
    <div v-if="quiz" class="text-xs-center py-3">
      <h2 class="title py-2">Quiz details</h2>
      <h3 class="subheading">Title: {{quiz.title}}</h3>
      <h4 class="subheading">Session: {{startDateString}} - {{endDateString}}</h4>
    </div>
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
      const tempDate = new Date(this.quiz.availableStart);
      tempDate.setSeconds(0, 0);
      return tempDate.toLocaleString();
    }

    return "N/A";
  }

  get endDateString(): string {
    if (this.quiz && this.quiz.availableEnd) {
      // Set seconds mutates
      const tempDate = new Date(this.quiz.availableEnd);
      tempDate.setSeconds(0, 0);
      return tempDate.toLocaleString();
    }

    return "N/A";
  }
}
</script>