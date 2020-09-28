<!-- 

Looks like this file is not used anywhere

TODO: REMOVE FILE


<template>
</template>

<script lang="ts">

import {Vue, Component} from "vue-property-decorator";
import { setIdToken, getLoginResponse } from "../../../common/js/front_end_auth";
import { IUserSession, QuizScheduleData } from "../../../common/interfaces/ToClientData";
import { LTIRoles } from "../../../common/enums/DBEnums";
import { convertNetworkQuizIntoQuiz } from "../../../common/js/NetworkDataUtils";

@Component
export default class Login extends Vue {
    private async created() {
        const q = this.$route.query.q;

        // Essentially redirects to the main page assuming login is correct
        setIdToken(q as string);
        const response = getLoginResponse();

        if (response) {
            await this.$store.dispatch("setUser", response.user);
            await this.$store.dispatch("setQuiz", quizScheduleData.quiz ? convertNetworkQuizIntoQuiz(quizScheduleData.quiz) : null);
            // Don't send the end time
            const session: IUserSession = {
                userId: response.user._id,
                course: response.courseId,
                startTime: (new Date()).toString(),
                role: LTIRoles.STUDENT
            }

            await this.$store.dispatch("createSession", session);
            this.$router.push("/");
        }
    }
}

</script>
