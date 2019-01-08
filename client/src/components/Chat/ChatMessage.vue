<template>
  <div class="chat-message">
    <div
      class="user-number"
      :class="userNumber"
    ></div>
    <div
      class="message"
      :class="userNumber"
    >
      {{content}}
    </div>
  </div>

</template>

<style lang="scss" scoped>
.chat-message {
  margin-bottom: 10px;
  .message {
    background-color: #fff;
    padding: 0.5em;
    &.one {
      border: 1px solid #6cc5b5;
    }
    &.two {
      border: 1px solid #97b003;
    }
    &.three {
      border: 1px solid #ffae00;
    }
    &.four {
      border: 1px solid #fd7558;
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import "../styles.scss";

@Component({})
export default class ChatMessage extends Vue {
  @Prop({}) private userNumber!: string;
  @Prop({}) private content!: string;
}
</script>