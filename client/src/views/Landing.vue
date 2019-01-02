<template>
  <section>
    <div class="content-container">
      <h1>Overview</h1>
      <div style="display: flex;
    flex-wrap: wrap;
    justify-content: center;">
        <OverviewContainer
          color="base1"
          number="1"
          title="Respond to Scenario"
        >
          <ul>
            <li>Read and respond to the scenario presented</li>
            <li>Score yourself on your confidence in explaining the concept</li>
            <li>Make sure to also keep track of the timer in the left sidebar</li>
          </ul>
        </OverviewContainer>
        <OverviewContainer
          color="base2"
          number="2"
          title="Formulate answer with Group"
        >
          <ul>
            <li>You’ll be put into a group of up to 3 students
            </li>
            <li>Discuss the responses from you and other students</li>
            <li>Your group must agree on a best response within chat limit</li>
          </ul>
        </OverviewContainer>
        <OverviewContainer
          color="base3"
          number="3"
          title="Reflect on discussion"
        >
          <ul>
            <li>Reflect on whether your response changed, and how</li>
            <li>Score yourself again on your confidence in explaining the
              concept</li>
          </ul>
        </OverviewContainer>
        <OverviewContainer
          color="base4"
          number="4"
          title="Complete Survey"
        >
          <ul>
            <li>Fill out a survey about your MOOCchat experience</li>
            <li>You’ll be presented a receipt of completion at the end for
              you to save or print</li>
          </ul>
        </OverviewContainer>
      </div>
      <div class="center">
        <router-link
          class="primary"
          tag="button"
          to="/initial-answer"
        >
          Start Session
        </router-link>
      </div>

    </div>

  </section>

  <!-- All pages must specify <section data-name="..." /> as root element, with name **equal to the file name**
    <section
      v-if="user"
      data-name="welcome"
    >
      <h1>Welcome, {{user.firstName}} </h1>
      <button
        id="not-you-help-link"
        class="neutral thin link"
      >Not you?</button>
      <p
        id="not-you-help"
        class="mc-inline-message"
      >
        Is your name not {{user.firstName}}?<br>
        <br>
        MOOCchat uses user data from Blackboard. If you would like to log in as someone else, please close MOOCchat, log out of Blackboard
        and try again.
      </p>

      <h2>How to use LIFE</h2>
      <ol class="welcome-instructions">
        <li>
          <h3>Respond to scenario</h3>
          <ul>
            <li>Read and respond to the scenario presented</li>
            <li>Score yourself on your confidence in explaining the concept</li>
            <li>Make sure to also keep track of the timer in the left sidebar</li>
          </ul>
        </li>
        <li>
          <h3>Discuss as a group and agree on a best response</h3>
          <ul>
            <li>You'll be put into a group of up to 3 students</li>
            <li>Discuss the responses from you and other students</li>
            <li>Your group must agree on a best response before the chat ends</li>
          </ul>
        </li>
        <li>
          <h3>Reflect on how you changed your thinking</h3>
          <ul>
            <li>Reflect on whether your response changed, and how</li>
            <li>Score yourself again on your confidence in explaining the concept</li>
          </ul>
        </li>
        <li>
          <h3>Complete a brief survey and finish</h3>
          <ul>
            <li>Fill out a survey about your MOOCchat experience</li>
            <li>You'll be presented a receipt of completion at the end for you to save or print</li>
          </ul>
        </li>
      </ol>

      <h2>Experiencing issues?</h2>
            <p>If you encounter issues, contact <a href="mailto:elearning@eait.uq.edu.au" target="_blank">elearning@eait.uq.edu.au</a> and supply a screenshot where possible.</p>-->

  <!-- <h2>Ready?</h2>
  <button id="start-session">Start your session</button>
  </section>
  <section v-else>
    <h1> Not logged in. Try to login through blackboard</h1>
  </section>
  </div> -->
</template>

<style scoped>
.content-container {
  background-color: white;
  border-radius: 5px;
  bottom: 0;
  box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.15);
  left: 0;
  height: 700px;
  max-width: 1640px;
  margin: auto;
  padding: 2em;
  position: absolute;
  right: 0;
  top: 0;
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { IUser } from "../../../common/interfaces/DBSchema";
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
}
</script>