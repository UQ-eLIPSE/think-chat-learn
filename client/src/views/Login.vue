<template></template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import {
  setIdToken,
  getLoginResponse,
  decodeToken,
} from "../../../common/js/front_end_auth";
import { convertNetworkQuizIntoQuiz } from "../../../common/js/NetworkDataUtils";
import { IUserSession } from "../../../common/interfaces/DBSchema";
import { LTIRoles } from "../../../common/enums/DBEnums";

import {
  QuizScheduleData,
  LoginResponse,
  IntermediateLogin,
  LoginResponseTypes,
} from "../../../common/interfaces/ToClientData";
import API from "../../../common/js/DB_API";
import { Names } from "../router";

@Component
export default class Login extends Vue {
  private async created() {
    const q = this.$route.query.q;

    // Essentially redirects to the main page assuming login is correct
    setIdToken(q as string);
    const response = getLoginResponse() as LoginResponse | IntermediateLogin;

    await this.$store.dispatch("storeSessionToken", q);

    const loginResponse = decodeToken(q as string) as LoginResponse;

    console.log("Decode Login View token: ", decodeToken(q as string));

    this.$router.push({ name: Names.FEEDBACK_LAUNCHER });
    console.log('After router push');
    // const attemptedResponse = await API.request(
    //   API.GET,
    //   API.QUIZSESSION + "history",
    //   {},
    //   undefined,
    //   q as string
    // );

    // console.log("Past: ", attemptedResponse);
    // const activeQuizzes = API.request(
    //   API.GET,
    //   API.QUIZ + "active",
    //   {},
    //   undefined,
    //   q as string
    // );
    // console.log("Active: ", activeQuizzes);

      
    // // If we have a response, fetch more data due to NGINX limitations
    // const quizScheduleData: QuizScheduleData = decodeToken(
    //   await this.$store.dispatch("handleToken")
    // );
    // // If we have a response , set the appropriate data and so on
    // if (response) {
    //   await this.$store.dispatch("setUser", response.user);
    //   await this.$store.dispatch(
    //     "setQuiz",
    //     quizScheduleData.quiz
    //       ? convertNetworkQuizIntoQuiz(quizScheduleData.quiz)
    //       : null
    //   );
    //   await this.$store.dispatch("setQuestions", quizScheduleData.questions);
    //   await this.$store.dispatch("setAvailability", response.available);
    //   // Don't send the end time
    //   const session: IUserSession = {
    //     userId: response.user._id,
    //     course: response.courseId,
    //     startTime: Date.now(),
    //   };
    //   await this.$store.dispatch("createSession", session);

    //   if (response.type === LoginResponseTypes.INTERMEDIATE_LOGIN) {
    //     await this.$store.dispatch(
    //       "retrieveQuizSession",
    //       response.quizSessionId
    //     );
    //   }

    //   this.$router.push("/");
    // }
  }
}
</script>
