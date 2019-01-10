<template>
  <div class="chat-alert">
    <label :class="alertType">{{ alertMessage }}</label>
  </div>
</template>

<style lang="scss" scoped>
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
      border: 1px solid #60afa1;
      color: #60afa1;
    }
    &.warning {
      background-color: rgba(253, 117, 88, 0.15);
      border: 1px solid #e26a51;
      color: #e26a51;
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
