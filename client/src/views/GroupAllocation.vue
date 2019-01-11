<template>
  <div class="container center">
    <h1>Searching for others to join...</h1>
    <ProgressLoader percentLoaded="88" />
    <p>You’ll be teamed up with a group discussion shortly.</p>
    <br />
    <p>
      If you do not progress to a chat within the time limit, return to
      Blackboard and try again; if this does not resolve your issue, please
      contact your course coordinator.
    </p>
    <span class="notifyTone">
      <b-switch></b-switch>
      <span>Play <b>notification tone</b> when my group is ready (keep window/tab
        open)</span>
    </span>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

.container {
  padding: 4em 0;

  .notifyTone {
    display: flex;
    justify-content: center;
    margin-top: 4em;
  }
}
</style>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import ProgressLoader from "../components/ProgressLoader.vue";

@Component({
  components: {
    ProgressLoader
  }
})
export default class GroupAllocation extends Vue {
  private notifyTone: boolean | null = null;
}
</script>
