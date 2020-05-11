<template>
  <div class="chat-alert">
    <label :class="alertType">
      <font-awesome-icon icon="exclamation-circle" /> {{ alertMessage }}</label>
  </div>
</template>

<style lang="scss" scoped>
.chat-alert {
  margin-bottom: 10px;
  label {
    font-size: 1em;
    font-weight: 500;
    &.standard {
      color: $light-blue;
    }
    &.warning {
      color: $red;
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component({})
export default class ChatMessage extends Vue {
  @Prop({}) private alertType!: string;
  @Prop({}) private alertMessage!: string;
}
</script>
