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

Component.registerHooks([
  'beforeRouteEnter',
  'beforeRouteUpdate'
])

@Component
export default class Login extends Vue {

  /**
   * Registers `JWT` / Fetches data from server and instantiates `store`
   */
  async login(v: Vue) {
    try {
      const q = v.$route.query.q;
      // Essentially redirects to the main page assuming login is correct
      if(q) {
        // If token is sent, reset token in local storage
        setIdToken(q as string);
      }
      
      const response = getAdminLoginResponse();
      // If we have a response, fetch more data due to NGINX limitations
      const otherToken = await this.$store.dispatch("handleToken");
      const quizScheduleData: QuizScheduleDataAdmin = decodeToken(otherToken);
      // If we have a response , set the appropiate data and so on
      if (response) {
        await v.$store.dispatch("setUser", response.user);
        await v.$store.dispatch("setCourse", response.courseId);
        // Remember to convert network quizzes to one with dates
        await v.$store.dispatch(
          "setQuizzes",
          quizScheduleData.quizzes.reduce((arr: IQuiz[], element) => {
            arr.push(convertNetworkQuizIntoQuiz(element));
            return arr;
          }, [])
        );
        await v.$store.dispatch("setRubrics", quizScheduleData.rubrics);
        await v.$store.dispatch("setCriterias", quizScheduleData.criterias);
        await v.$store.dispatch("setQuestions", quizScheduleData.questions);
        v.$router.push("/");
      }
    } catch(e) {
      throw new Error("Error occurred during login.");
    }
  }

  async beforeRouterUpdate(to: any, from: any, next: any) {
    await this.login(this);
    next();
  }

  beforeRouteEnter(to: any, from: any, next: any) {
    next(async(vm: this) => {
      await vm.login(vm);
    });
    
  }
}
</script>
