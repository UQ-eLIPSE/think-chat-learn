<template>
  <div class="chat-message">
    <CircularNumberLabel :numeral="numeral" />
    <div class="message"
         :class="`base${+numeral} ${selected?'selected':''}`">
      <span>{{ content }}</span>
    </div>
  </div>
</template>



<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import CircularNumberLabel from "./CircularNumberLabel.vue";

@Component({
  components: {
    CircularNumberLabel
  }
})
export default class ChatMessage extends Vue {
  // @Prop({}) private userNumber!: string;
  @Prop({ required: true, default: () => '' }) private content!: string;
  @Prop({}) private numeral!: number;
  @Prop({ default: false }) private isTyping!: boolean;
  @Prop({ required: false, default: false }) private selected!: boolean;
}
</script>
<style lang="scss" scoped>
@import "../../../css/variables.scss";

.chat-message {
  margin-bottom: 10px;
  margin-left: 15px;
  position: relative;
  word-break: break-word;
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
      &.selected {
        border-width: 4px;
      }
    }

    &.base2 {
      border: 1px solid $baseLight2;
      &.selected {
        border-width: 4px;
      }
    }

    &.base3 {
      border: 1px solid $baseLight3;
      &.selected {
        border-width: 4px;
      }
    }

    &.base4 {
      border: 1px solid $baseLight4;
      &.selected {
        border-width: 4px;
      }
    }

    span {
      font-weight: 400;
      margin-left: 15px;
    }
  }
}
</style>