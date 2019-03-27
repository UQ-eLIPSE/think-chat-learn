<template>
  <div class="marking-section">
    <div class="row">
      <div class="chat-messages">
        <h3>Chat messages</h3>
        <div class="chat"
             v-if="chatMessages">
          <div class="message-container">
            <div v-for="m in chatMessages"
                 :key="m._id">
              <ChatMessage v-if="m"
                           :selected="messageBelongsTocurrentQuizSessionInfoObject(m.quizSessionId)"
                           :numeral="getNumeralFromQuizSessionId(m.quizSessionId)"
                           :content="m.content" />
            </div>
          </div>
        </div>
      </div>

      <div class="column">
        <div class="responses-container">
          <h3>Responses</h3>
          <div class="responses message-container"
               v-if="currentChatGroupResponses">
            <ChatMessage v-for="r in currentChatGroupResponses"
                         v-if="r"
                         :key="r._id"
                         :selected="responseBelongsTocurrentQuizSessionInfoObject(r.quizSessionId)"
                         :numeral="getNumeralFromQuizSessionId(r.quizSessionId)"
                         :content="r.content" />
          </div>
        </div>
        <MarkingComponent class="marking-component"></MarkingComponent>
      </div>
    </div>


  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage, IQuestion, IQuestionAnswerPage, IQuizSession, IUserSession, IUser, IChatGroup, Response, QuizSessionDataObject } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import ChatMessage from './ChatMessage.vue';
import MarkingComponent from './MarkingComponent.vue';

@Component({
  components: {
    ChatMessage,
    MarkingComponent
  }
})
export default class MarkQuizMarkingSection extends Vue {

  get currentQuizSessionInfoObject(): QuizSessionDataObject | undefined {
    return this.$store.getters.currentQuizSessionInfoObject;
  }

  get currentMarkingContext() {
    return this.$store.getters.currentMarkingContext;
  }

  get chatMessages() {
    if (!this.$store.getters.currentChatGroupQuestionMessages) return [];
    return this.$store.getters.currentChatGroupQuestionMessages;
  }
  get currentChatGroupResponses() {
    return this.$store.getters.currentChatGroupQuestionResponses || [];
  }
  messageBelongsTocurrentQuizSessionInfoObject(qid: string): boolean {
    if (!this.currentQuizSessionInfoObject || !this.currentQuizSessionInfoObject.quizSession) return false;
    return (this.currentQuizSessionInfoObject.quizSession._id === qid);
  }

  get currentChatGroup() {
    return this.$store.getters.currentChatGroup;
  }
  responseBelongsTocurrentQuizSessionInfoObject(qid: string): boolean {
    if (!this.currentQuizSessionInfoObject || !this.currentQuizSessionInfoObject.quizSession) return false;
    return (this.currentQuizSessionInfoObject.quizSession._id === qid);
  }
  getNumeralFromQuizSessionId(qid: string) {
    if (!this.currentChatGroup || !this.currentChatGroup.quizSessionIds) return 1;
    const ind = this.currentChatGroup.quizSessionIds.indexOf(qid);
    if (ind === -1) return 1;
    return ind + 1;

  }
}
</script>
<style lang="scss" scoped>
@import "../../../css/variables.scss";
.sidebar {
  color: white;
  text-shadow: rgb(85, 85, 85) 0.05em 0.05em 0.05em;
  width: 18rem;
  font-size: 1.2rem;
  overflow-y: hidden;
  background: rgb(150, 85, 102);
}

.course-name {
  font-style: italic;
  margin: 1rem 2rem 1.5rem;
}

.moochat-name {
  line-height: 1;
  margin: 2rem 2rem 1rem;
}

.question-box {
  display: flex;
  flex-direction: column;
  border: 0.1em solid teal;
  padding: 0.5rem;
}

.marking-section {
  display: flex;
  flex-direction: column;
}

.marking-section>* {
  margin: 1rem 0;
}

.chat {
  background-color: #f7f8f8;
  box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.15);
  max-height: 30vh;
  width: 100%;

  .message-container {
    max-height: 100%;
    overflow: auto;
    padding: 15px;
  }
}

.row {
  display: flex;
  width: 100%;
  height: 65vh;
}

.chat-messages {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 50%;
}

.responses-container {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  max-height: 30vh;
  overflow: auto;
  // width: 50%;
}

.marking-component {
  flex-shrink: 0;
}

.column {
  display: flex;
  flex-direction: column;
  max-width: 50%;
}
</style>