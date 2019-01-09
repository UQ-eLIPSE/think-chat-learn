<template>
  <div class="chat-message">
    <CircularNumberLabel :numeral="numeral" />
    <div
      class="message"
      :class="`base${+ numeral}`"
    >
      <p>{{content}}</p>
    </div>
  </div>

</template>

<style lang="scss" scoped>
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
    background-color: #fff;
    padding: 0.5em;
    &.base1 {
      border: 1px solid #6cc5b5;
    }
    &.base2 {
      border: 1px solid #97b003;
    }
    &.base3 {
      border: 1px solid #ffae00;
    }
    &.base4 {
      border: 1px solid #fd7558;
    }

    p {
      font-weight: 400;
      margin-left: 15px;
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import "../../styles.scss";
import CircularNumberLabel from "../CircularNumberLabel.vue";

@Component({
  components: {
    CircularNumberLabel
  }
})
export default class ChatMessage extends Vue {
  @Prop({}) private userNumber!: string;
  @Prop({}) private content!: string;
  @Prop({}) private numeral!: number;
}
</script>