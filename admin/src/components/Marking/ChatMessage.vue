<template>
  <div :class="chat-message">
    <CircularNumberLabel :numeral="numeral" />
    <div class="message"
         :class="`base-cl-${numeral} border-cl transparent-cl ${selected?'selected':''}`">
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
@import "../../../css/partial/variables";

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
    padding: 0.5em;
    span {
      font-weight: 400;
      margin-left: 15px;
    }
  }
}
</style>