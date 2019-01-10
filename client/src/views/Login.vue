<template> </template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import {
  setIdToken,
  getLoginResponse
} from "../../../common/js/front_end_auth";

@Component
export default class Login extends Vue {
  private async created() {
    const q = this.$route.query.q;

    // Essentially redirects to the main page assuming login is correct
    setIdToken(q as string);
    const response = getLoginResponse();

    // If we have a response , set the appropiate data and so on
    if (response) {
      await this.$store.dispatch("setUser", response.user);
      await this.$store.dispatch("setQuiz", response.quiz);
      this.$router.push("/");
    }
  }
}
</script>
