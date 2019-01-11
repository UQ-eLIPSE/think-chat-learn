<template>
  <div class="landing">
    <h1>Overview</h1>
    <div class="content-inner-container">
      <OverviewContainer
        numeral="1"
        title="Respond to Scenario"
      >
        <ul>
          <li>
            <font-awesome-icon
              class="base1"
              icon="circle"
            /> Read and respond to the scenario presented
          </li>
          <li>
            <font-awesome-icon
              class="base1"
              icon="circle"
            /> Score yourself on your confidence in explaining the concept</li>
          <li>
            <font-awesome-icon
              class="base1"
              icon="circle"
            /> Make sure to also keep track of the timer in the left sidebar</li>
        </ul>
      </OverviewContainer>
      <OverviewContainer
        numeral="2"
        title="Formulate answer with Group"
      >
        <ul>
          <li>
            <font-awesome-icon
              class="base2"
              icon="circle"
            /> You’ll be put into a group of up to 3 students</li>
          <li>
            <font-awesome-icon
              class="base2"
              icon="circle"
            /> Discuss the responses from you and other students</li>
          <li>
            <font-awesome-icon
              class="base2"
              icon="circle"
            /> Your group must agree on a best response within chat limit</li>
        </ul>
      </OverviewContainer>
      <OverviewContainer
        numeral="3"
        title="Reflect on discussion"
      >
        <ul>
          <li>
            <font-awesome-icon
              class="base3"
              icon="circle"
            /> Reflect on whether your response changed, and how</li>
          <li>
            <font-awesome-icon
              class="base3"
              icon="circle"
            /> Score yourself again on your confidence in explaining the concept
          </li>
        </ul>
      </OverviewContainer>
      <div class="spacer"></div>
      <OverviewContainer
        numeral="4"
        title="Complete Survey"
      >
        <ul>
          <li>
            <font-awesome-icon
              class="base4"
              icon="circle"
            /> Fill out a survey about your MOOCchat experience</li>
          <li>
            <font-awesome-icon
              class="base4"
              icon="circle"
            /> You’ll be presented a receipt of completion at the end for you to
            save or print
          </li>
        </ul>
      </OverviewContainer>
    </div>
    <div class="center margin-top">
      <router-link
        class=" primary"
        tag="button"
        to="/initial-answer"
      >
        <span>Start Session</span>
      </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

.landing {
  padding: 2em 3em 3em 3em;

  .content-inner-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }

  li {
    svg {
      font-size: 13px;
      margin-right: 0.5em;
      vertical-align: baseline;

      &.base1 {
        color: #6dc7b7;
      }
      &.base2 {
        color: #99b204;
      }
      &.base3 {
        color: #ffae00;
      }
      &.base4 {
        color: #ff7659;
      }
    }
  }
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
