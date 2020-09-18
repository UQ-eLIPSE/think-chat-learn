<template>
  <div class="chat-messages" v-if="messages && messages.length > 0 && quizSessionId">
    <div class="message-container">
      <ChatMessage
        v-for="m in messages"
        :key="m._id"
        :selected="messageBelongsTocurrentQuizSessionId(m)"
        :numeral="getNumeralFromQuizSessionId(m.quizSessionId)"
        :content="m.content"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import {
  Page,
  IQuestion,
  IResponse,
  IQuestionAnswerPage,
  IResponseQualitative,
  IResponseMCQ,
  IChatGroup,
  IDiscussionPage,
  IChatMessage,
} from "../../../../common/interfaces/DBSchema";
import InfoViewer from "./InfoViewer.vue";
import { QuestionType } from "../../../../common/enums/DBEnums";
import ChatMessage from "../Marking/ChatMessage.vue";

@Component({
  components: {
    InfoViewer,
    ChatMessage
  },
})
export default class DiscussionViewer extends Vue {
  @Prop({ default: undefined, required: true })
  page!: IDiscussionPage;
  @Prop({ default: undefined, required: true }) quizSessionId!: string;
  @Prop({ default: undefined, required: true }) chatGroup!: IChatGroup;

  getNumeralFromQuizSessionId(quizSessionId: string) {
    if (!this.chatGroup || !this.chatGroup.quizSessionIds || !Array.isArray(this.chatGroup.quizSessionIds)) return 1;
    const ind = this.chatGroup.quizSessionIds.indexOf(quizSessionId);
    if (ind === -1) return 1;
    return ind + 1;
  }

  messageBelongsTocurrentQuizSessionId(message: IChatMessage) {
    if (!this.quizSessionId || !message || !message.quizSessionId) return false;

    return message.quizSessionId === this.quizSessionId;
  }

  get messages() {
    return (this.chatGroup && this.chatGroup.messages) || [];
  }
}
</script>

<style scoped lang="scss">
.flex-row {
  display: flex;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.chat {
  background-color: #f7f8f8;
  box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.15);
  /* max-height: 30vh; */
  width: 100%;
  overflow: auto;

  .message-container {
    max-height: 100%;
    overflow: auto;
    padding: 15px;
  }
}

.chat-messages {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  max-height: 70vh;
  height: 450px;
  min-height: 450px;
  overflow: scroll;
  resize: vertical;
}
</style>

<style lang="scss">
@mixin coloredBackground($color) {
  background-color: rgba($color, 0.1);
  border-width: 1px;
}

.chat-message .message{
  border-width: 1px;

  &.selected {
    &.base1 { @include coloredBackground(blue); }
    &.base2 { @include coloredBackground(green); }
    &.base3 { @include coloredBackground(yellow); }
    &.base4 { @include coloredBackground(red); }
  }
}
</style>