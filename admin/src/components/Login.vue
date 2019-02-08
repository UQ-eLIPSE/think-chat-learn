<template>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import {
  getAdminLoginResponse,
  setIdToken,
  decodeToken
} from "../../../common/js/front_end_auth";
import { convertNetworkQuizIntoQuiz } from "../../../common/js/NetworkDataUtils";
import { IQuiz, QuizScheduleDataAdmin } from "../../../common/interfaces/ToClientData";
@Component
export default class Login extends Vue {
  private async created() {
    const q = this.$route.query.q;

    // Essentially redirects to the main page assuming login is correct
    setIdToken(q as string);
    const response = getAdminLoginResponse();

    // If we have a response, fetch more data due to NGINX limitations
    const otherToken = await this.$store.dispatch("handleToken");
    const quizScheduleData: QuizScheduleDataAdmin = decodeToken(otherToken);
    // If we have a response , set the appropiate data and so on
    if (response) {
      await this.$store.dispatch("setUser", response.user);

      // Remember to convert network quizzes to one with dates
      await this.$store.dispatch(
        "setQuizzes",
        quizScheduleData.quizzes.reduce((arr: IQuiz[], element) => {
          arr.push(convertNetworkQuizIntoQuiz(element));
          return arr;
        }, [])
      );

      await this.$store.dispatch("setQuestions", quizScheduleData.questions);
      this.$router.push("/");
    }
  }
}
</script>
