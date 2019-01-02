<template>
</template>

<script lang="ts">

import {Vue, Component} from "vue-property-decorator";
import { getAdminLoginResponse, setIdToken } from "../../../common/js/front_end_auth";

@Component
export default class Login extends Vue {
    private async created() {
        const q = this.$route.query.q;

        // Essentially redirects to the main page assuming login is correct
        setIdToken(q as string);
        const response = getAdminLoginResponse();
        // If we have a response , set the appropiate data and so on
        if (response) {
            await this.$store.dispatch("setUser", response.user);
            await this.$store.dispatch("setQuizzes", response.quizzes);
            await this.$store.dispatch("setQuestions", response.questions);
            this.$router.push("/");
        }
    }
}

</script>
