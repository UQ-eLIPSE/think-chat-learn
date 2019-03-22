<template>
  <div class="marking-section">
    <div class="row">
      <div class="chat-messages">
        <div>Chat messages</div>
        <div class="chat"
             v-if="chatMessages">
          <div class="message-container">
            <div v-for="m in chatMessages"
                 :key="m._id">
              <ChatMessage v-if="m"
                           :selected="messageBelongsToCurrentQuizSession(m.quizSessionId)"
                           :numeral="getNumeralFromQuizSessionId(m.quizSessionId)"
                           :content="m.content" />
            </div>
          </div>
        </div>
      </div>
      <div class="responses-container">
        <h1>Responses</h1>
        <div class="responses message-container"
             v-if="currentChatGroupResponses">
          <ChatMessage v-for="r in currentChatGroupResponses"
                       v-if="r"
                       :key="r._id"
                       :selected="responseBelongsToCurrentQuizSession(r.quizSessionId)"
                       :numeral="getNumeralFromQuizSessionId(r.quizSessionId)"
                       :content="r.content" />
        </div>
      </div>
    </div>
    <h1>Marking Rubric</h1>
    <MarkingComponent :quiz="quiz"
                      :question="question"
                      :currentQuizSession.sync="currentQuizSession"></MarkingComponent>
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
  @Prop({ required: true, default: () => null }) private chatGroup: IChatGroup | undefined;
  @Prop({ required: true, default: () => null }) private question: IQuestionAnswerPage | undefined;
  @Prop({ required: false, default: () => [] }) private chatMessages: any[] | undefined;
  @Prop({ required: false, default: () => { } }) private quizSessionMap: { [key: string]: { quizSession: IQuizSession | undefined, userSession: IUserSession | undefined, user: IUser | undefined, responses: Response[] } } | undefined
  @Prop({ required: false, default: () => { } }) private currentQuizSession: QuizSessionDataObject | undefined
  @Prop({ required: false, default: () => { } }) private quiz: IQuiz | undefined;


  getUsernameFromQuizSessionId(qid: string) {
    if (!this.quizSessionMap || !this.quizSessionMap[qid] || !this.quizSessionMap[qid]!.user || !this.quizSessionMap[qid].user!.username!) return '?';
    return this.quizSessionMap![qid]!.user!.username!
  }

  get currentChatGroupResponses() {
    if (!this.chatGroup || !this.quizSessionMap || !this.question) return [];

    const chatGroupQuizSessionIds = this.chatGroup.quizSessionIds || [];
    // Fetch responses for quiz session ids in the current group pertaining to the current question
    const chatGroupQuizSessions = Object.keys(this.quizSessionMap!).filter((qid: string) => chatGroupQuizSessionIds!.indexOf(qid) !== -1).map((ccgId: string) => this.quizSessionMap![ccgId]);
    console.log('Quiz sessions of those present in current chat group: ')
    console.log(chatGroupQuizSessions)
    const responsesForCurrentQuestion: Response[] = [];

    chatGroupQuizSessions.forEach((qs) => {
      const responseToCurrentQuestion = qs.responses.find((r) => r.questionId === this.question!.questionId!);
      console.log('response for quiz session ', qs!.quizSession!._id, ": \n ", responseToCurrentQuestion);
      if (responseToCurrentQuestion) {
        responsesForCurrentQuestion.push(responseToCurrentQuestion);
      }
    });

    return responsesForCurrentQuestion;
  }
  messageBelongsToCurrentQuizSession(qid: string): boolean {
    if (!this.currentQuizSession || !this.currentQuizSession.quizSession) return false;
    return (this.currentQuizSession.quizSession._id === qid);
  }


  responseBelongsToCurrentQuizSession(qid: string): boolean {
    if (!this.currentQuizSession || !this.currentQuizSession.quizSession) return false;
    return (this.currentQuizSession.quizSession._id === qid);
  }
  getNumeralFromQuizSessionId(qid: string) {
    if (!this.chatGroup || !this.chatGroup.quizSessionIds) return 1;
    const ind = this.chatGroup.quizSessionIds.indexOf(qid);
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


.chat {
  background-color: #f7f8f8;
  box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.15);
  max-height: 30vh;
  padding-top: 75px;
  width: 50%;
  z-index: 1;

  .message-container {
    max-height: 100%;
    overflow: scroll;
    padding: 15px;
  }
}

.row {
  display: flex;
  width: 100%;
  height: 30vh;
}

.chat-messages {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 70%;
}
.responses-container {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 30%;
}
</style>