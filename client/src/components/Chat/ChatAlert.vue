<template>
  <div class="chat-alert">
    <label :class="alertType">
      <font-awesome-icon icon="exclamation-circle" /> {{ alertMessage }}</label>
  </div>
</template>

<style lang="scss" scoped>
@import "../../../css/variables.scss";

.chat-alert {
  margin-bottom: 10px;
  label {
    border-radius: 5px;
    display: block;
    font-size: 1rem;
    font-weight: 600;
    padding: 10px;
    &.standard {
      background-color: rgba(96, 175, 161, 0.15);
      border: 1px solid $baseDark1;
      color: $baseDark1;
    }
    &.warning {
      background-color: rgba(253, 117, 88, 0.15);
      border: 1px solid $baseDark4;
      color: $baseDark4;
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component({})
export default class ChatMessage extends Vue {
  @Prop({}) private alertType!: string;
  @Prop({}) private alertMessage!: number;
}
</script>
