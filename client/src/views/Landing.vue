<template>
  <div class="padding-wrapper">
    <h1>Overview</h1>
    <div class="content-inner-container">
      <OverviewContainer numeral="1" title="Respond to Scenario">
        <ul>
          <li>Read and respond to the scenario presented</li>
          <li>Score yourself on your confidence in explaining the concept</li>
          <li>Make sure to also keep track of the timer in the left sidebar</li>
        </ul>
      </OverviewContainer>
      <OverviewContainer numeral="2" title="Formulate answer with Group">
        <ul>
          <li>You’ll be put into a group of up to 3 students</li>
          <li>Discuss the responses from you and other students</li>
          <li>Your group must agree on a best response within chat limit</li>
        </ul>
      </OverviewContainer>
      <OverviewContainer numeral="3" title="Reflect on discussion">
        <ul>
          <li>Reflect on whether your response changed, and how</li>
          <li>
            Score yourself again on your confidence in explaining the concept
          </li>
        </ul>
      </OverviewContainer>
      <div class="spacer"></div>
      <OverviewContainer numeral="4" title="Complete Survey">
        <ul>
          <li>Fill out a survey about your MOOCchat experience</li>
          <li>
            You’ll be presented a receipt of completion at the end for you to
            save or print
          </li>
        </ul>
      </OverviewContainer>
    </div>
    <div class="center margin-top">
      <button v-if="quiz" class="primary" tag="button" @click="startQuizSession()">
        Start Session
      </button>
      <!-- TODO Style unavailable button -->
      <!-- Note button was used instead of router-link due to @click not being listened -->
      <button v-else class="primary" tag="button">
        No Session Available
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content-inner-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.padding-wrapper {
  padding: 2em 3em 3em 3em;
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { IUser, IQuiz, IQuizSession, IUserSession } from "../../../common/interfaces/ToClientData";
import OverviewContainer from "../components/OverviewContainer.vue";

@Component({
  components: {
    OverviewContainer
  }
})
export default class Landing extends Vue {
  get user(): IUser | null {
    return this.$store.getters.user;
  }

  get quiz(): IQuiz | null {
    return this.$store.getters.quiz;
  }

  get userSession(): IUserSession | null {
    return this.$store.getters.userSession;
  }

  private startQuizSession() {
    const outgoingQuizSession: IQuizSession = {
        quizId: this.quiz!._id,
        userSessionId: this.userSession!._id,
        responses: []
    }

    this.$store.dispatch("createQuizSession", outgoingQuizSession).then(() => {
      this.$router.push("/page");
    }).catch((e: Error) => {
      console.error(e);
    });
  }
}
</script>
