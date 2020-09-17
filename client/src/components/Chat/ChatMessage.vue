<template>
  <div class="chat-message">
    <CircularNumberLabel :numeral="numeral" />
    <div class="message" :class="`base${+numeral} ${selected?'selected':''}`">
      <span>{{ content }}</span>
      <template v-if="isTyping">
        <Spinner />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@mixin coloredBorder($color) {
  border: 1px solid $color;
}

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
    font-size: 0.87em;
    padding: 0.75em;

    &.base1 { @include coloredBorder($light-blue); }
    &.base2 { @include coloredBorder($green); }
    &.base3 { @include coloredBorder($yellow); }
    &.base4 { @include coloredBorder($red); }

    span {
      font-weight: 400;
      margin-left: 15px;
      white-space: pre-wrap;
    }

    &.selected {
      border-width: 4px;
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
  // @Prop({}) private userNumber!: string;
  @Prop({}) private content!: string;
  @Prop({}) private numeral!: number;
  @Prop({ default: false }) private isTyping!: boolean;
  @Prop({ required: false, default: false }) private selected!: boolean;
}
</script>
