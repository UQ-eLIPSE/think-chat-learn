<template> </template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import {
  setIdToken,
  getLoginResponse, decodeToken
} from "../../../common/js/front_end_auth";
import { convertNetworkQuizIntoQuiz } from "../../../common/js/NetworkDataUtils";
import { IUserSession } from "../../../common/interfaces/DBSchema";
import { LTIRoles } from "../../../common/enums/DBEnums";
import { QuizScheduleData, LoginResponse, IntermediateLogin,
  LoginResponseTypes } from "../../../common/interfaces/ToClientData";

@Component
export default class Login extends Vue {
  private async created() {
    const q = this.$route.query.q;

    // Essentially redirects to the main page assuming login is correct
    setIdToken(q as string);
    const response = getLoginResponse() as LoginResponse | IntermediateLogin;
    await this.$store.dispatch("storeSessionToken", q);
    // If we have a response, fetch more data due to NGINX limitations
    const quizScheduleData: QuizScheduleData = decodeToken(await this.$store.dispatch("handleToken"));
    // If we have a response , set the appropiate data and so on
    if (response) {
      await this.$store.dispatch("setUser", response.user);
      await this.$store.dispatch("setQuiz", quizScheduleData.quiz ?
        convertNetworkQuizIntoQuiz(quizScheduleData.quiz) : null);
      await this.$store.dispatch("setQuestions", quizScheduleData.questions);
      await this.$store.dispatch("setAvailability", response.available);
      // Don't send the end time
      const session: IUserSession = {
          userId: response.user._id,
          course: response.courseId,
          startTime: Date.now(),
      };
      await this.$store.dispatch("createSession", session);

      if (response.type === LoginResponseTypes.INTERMEDIATE_LOGIN) {
        await this.$store.dispatch("retrieveQuizSession", response.quizSessionId);
      }

      this.$router.push("/");
    }
  }
}
</script>
