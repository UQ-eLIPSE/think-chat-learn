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

    await this.$store.dispatch("setUser", response.user);

    this.$router.push({ name: Names.FEEDBACK_LAUNCHER });
  }
}
</script>
