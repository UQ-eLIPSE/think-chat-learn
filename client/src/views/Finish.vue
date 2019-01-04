<template>
  <div
    class="container center"
    v-if="user"
  >
    <h1>Thank you, {{user.firstName}} for completing these questions! </h1>
    <label class="attempt"><b>Attempt ID:</b> 1cc5 b3c4 f05b da34 6d73 3584</label>
    <div class="content">
      <p><b>Save</b> or <b>print</b> this for your records.</p>

      <p>If you need to discuss your <b>MOOCchat</b> in the future,<br />
        please provide this ID in your communications.</p>
    </div>

    <button class="primary">Blackboard</button>
    <button class="primary">Print Receipt</button>
  </div>
</template>

<style lang="scss" scoped>
.container {
  padding: 4em 0;
  label.attempt {
    background-color: rgba(254, 173, 0, 0.1);
    border: 3px solid #fead00;
    border-radius: 10px;
    color: #fead00;
    font-size: 1.5em;
    padding: 10px 40px;
  }
  .content {
    margin: 3em 0;
    p {
      color: #515456;
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