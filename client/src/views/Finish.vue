<template>
  <div
    class="container center"
    v-if="user"
  >
    <h1>Thank you, {{ user.firstName }} for completing these questions!</h1>
    <label class="attempt">
      <font-awesome-icon icon="star" />&nbsp;<b>Attempt ID:</b> 1cc5 b3c4 f05b da34 6d73 3584</label>
    <div class="content">
      <p><b>Save</b> or <b>print</b> this for your records.</p>

      <p>
        If you need to discuss your <b>MOOCchat</b> in the future,<br />
        please provide this ID in your communications.
      </p>
    </div>

    <button class="primary">
      <font-awesome-icon icon="chalkboard" /> Blackboard</button>
    <button class="primary">
      <font-awesome-icon icon="print" /> Print Receipt</button>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

.container {
  padding: 4em 0;
  label.attempt {
    background-color: rgba(254, 173, 0, 0.1);
    border: 3px solid $baseLight3;
    border-radius: 10px;
    color: $baseLight3;
    display: inline-block;
    font-size: 1.5em;
    margin-top: 1.5em;
    padding: 10px 40px;
  }
  .content {
    margin: 3em 0;
    p {
      color: $text;
      font-size: 1.25em;
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { IUser } from "../../../common/interfaces/DBSchema";

@Component({})
export default class Finish extends Vue {
  get user(): IUser | null {
    return this.$store.getters.user;
  }
}
</script>
