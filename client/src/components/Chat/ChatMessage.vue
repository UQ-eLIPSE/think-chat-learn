<template>
  <div class="chat-message">
    <CircularNumberLabel :numeral="numeral" />
    <div
      class="message"
      :class="`base${+numeral}`"
    >
      <span>{{ content }}</span>
      <!-- <p>is typing</p> -->
      <Spinner />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../../css/variables.scss";

.chat-message {
  margin-bottom: 10px;
  margin-left: 15px;
  position: relative;
  label {
    width: 30px;
    height: 30px;
    border: 0;
    font-size: 1.25rem;
    left: -15px;
    position: absolute;
    top: 0;
    margin-top: 0;
    margin: auto 0;
    transform: translateY(20%);
  }
  .message {
    background-color: $white;
    padding: 0.5em;

    &.base1 {
      border: 1px solid $baseLight1;
    }

    &.base2 {
      border: 1px solid $baseLight2;
    }

    &.base3 {
      border: 1px solid $baseLight3;
    }

    &.base4 {
      border: 1px solid $baseLight4;
    }

    span {
      font-weight: 400;
      margin-left: 15px;
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import CircularNumberLabel from "../CircularNumberLabel.vue";
import Spinner from "../Spinner.vue";

@Component({
  components: {
    CircularNumberLabel,
    Spinner
  }
})
export default class ChatMessage extends Vue {
  @Prop({}) private userNumber!: string;
  @Prop({}) private content!: string;
  @Prop({}) private numeral!: number;
}
</script>
