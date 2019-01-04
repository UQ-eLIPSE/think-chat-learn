<template>
  <div class="container center">
    <h1>Searching for others to join...</h1>
    <ProgessLoader percentLoaded="54" />
    <div class="progress-loader">
      <div class="percent-loading">56%</div>
      <div class="loaderest"></div>
    </div>
    <div
      class="outer"
      style="border: 1px solid black; height: 50px; width: 500px;"
    >
      <div
        class="inner"
        style="background-color: aliceblue; width: 65%; height: 25px;"
      ></div>
    </div>
    <p>You’ll be teamed up with a group discussion shortly.</p><br />
    <p>If you do not progress to a chat within the time limit, return to Blackboard and try again; if this does not resolve your issue, please contact your course coordinator.</p>
    <div class="field">
      <b-switch
        v-model="isSwitchedCustom"
        true-value="Yes"
        false-value="No"
      >
        {{ isSwitchedCustom }}
      </b-switch>
    </div>
    <p>Play <b>notification tone</b> when my group is ready (keep window/tab open)</p>
  </div>
</template>

<style lang="scss" scoped>
.container {
  padding: 4em 0;
  .progress-loader {
    color: #fead00;
    font-size: 12em;
    font-weight: 600;
    line-height: 1;
    margin: 0 auto 0.25em auto;
    width: 365px;
    .loaderest {
      content: " ";
      background: linear-gradient(to right, #fead00 0%, #ff7659 100%);
      border-radius: 20px;
      box-shadow: inset 0 0 0 2px rgba(165, 165, 165, 0.5),
        inset 0 0 0 10px #fff;
      height: 35px;
      margin: 0 auto;
      // width: 100%;
    }
  }
}
</style>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({})
export default class GroupAllocation extends Vue {}
</script>