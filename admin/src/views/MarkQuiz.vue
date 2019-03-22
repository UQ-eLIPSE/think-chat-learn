<template>
  <div class="marking">
    <div v-if="q"
         class="q-details">
      <span>Quiz ID: {{q._id}}</span>
      <span>Title: {{ q.title }}</span>
      <span>Available Start: {{ q.availableStart }}</span>
      <span>Available End: {{ q.availableEnd }}</span>
    </div>

    <select v-model="selectedGroupId">
      <option v-for="(g, i) in chatGroups"
              :value="g._id"
              :key="g._id"> Group {{i + 1}} ({{g._id}})</option>
    </select>

    <div class="group-mark"
         v-if="selectedGroup">
      <select v-model="selectedQuestionId">
        <option v-for="(qid, i) in orderedDiscussionPageQuestionIds"
                :value="qid"
                :key="qid">{{ (getQuestionById(qid) || { title: qid }).title }}</option>
      </select>

      <div class="question-discussion"
           v-if="selectedQuestion">
        <div class="question-box">
          <span> Question Title:
            <b>{{ selectedQuestion.title }}</b>
          </span>
          <span> {{ selectedQuestion.content }}</b>
          </span>
        </div>

        <select v-model="selectedUsernameInChatGroup">
          <option v-for="s in groupQuizSessions"
                  :key="s.user.username"
                  :value="s.user.username">{{ s.user.username }}</option>
        </select>

        <MarkQuizMarkingSection :question="selectedQuestion"
                                :chatGroup="selectedGroup"
                                :quizSessionMap="quizSessionMap"
                                :currentQuizSession.sync="currentUserQuizSession"
                                class="marking-section"
                                :quiz="q"
                                :chatMessages="selectedQuestionChatMessages" />
      </div>

    </div>

    <div v-else>Select a group from the dropdown list</div>


  </div>

  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage, IQuestionAnswerPage, IQuizSession, IChatGroup, IUserSession, IUser, QuizSessionDataObject } from "../../../common/interfaces/ToClientData";

import { PageType } from "../../../common/enums/DBEnums";
import MarkQuizMarkingSection from '../components/Marking/MarkQuizMarkingSection.vue';
import { API } from "../../../common/js/DB_API";


@Component({
  components: {
    MarkQuizMarkingSection
  }
})
export default class MarkQuiz extends Vue {
  private selectedGroupId: string = '';
  private selectedQuestionId: string = '';
  private selectedUsernameInChatGroup: string = '';
  private quizSessionMap: { [key: string]: QuizSessionDataObject } = {}
  get q() {
    if (!this.$route.params.id) return null;
    return this.quizzes.find((q) => q._id === this.$route.params.id);
  }
  get quizzes(): IQuiz[] {
    return this.$store.getters.quizzes || [];
  }

  get currentUserQuizSession() {
    return this.groupQuizSessions.find((s) => s.user!.username === this.selectedUsernameInChatGroup)
  }
  getQuestionById(questionId: string) {
    if (!this.q || !this.q.pages) return undefined;
    return this.q.pages.find((p) => p.type === PageType.QUESTION_ANSWER_PAGE && (p as IQuestionAnswerPage).questionId === questionId);
  }
  get selectedQuestionChatMessages() {
    if (this.chatGroupQuestionIdMap && this.chatGroupQuestionIdMap[this.selectedQuestionId]) {
      return this.chatGroupQuestionIdMap[this.selectedQuestionId].messages;
    } else {
      return [];
    }
  }

    get selectedQuestionResponses() {
    if (this.chatGroupQuestionIdMap && this.chatGroupQuestionIdMap[this.selectedQuestionId]) {
      return this.chatGroupQuestionIdMap[this.selectedQuestionId].messages;
    } else {
      return [];
    }
  }
  get selectedQuestion() {
    if (!this.q || !this.selectedGroup || !this.q.pages) return undefined;
    const question = this.q.pages.find((p) => p.type === PageType.QUESTION_ANSWER_PAGE && ((p as IQuestionAnswerPage).questionId === this.selectedQuestionId));
    return question;
  }
  get chatGroups() {
    return this.$store.state.Quiz.chatGroups || [];
  }

  get selectedGroup(): IChatGroup | null {
    if (!this.chatGroups || !this.selectedGroupId) return null;
    return this.chatGroups.find((g: any) => g._id === this.selectedGroupId);
  }


  get orderedDiscussionPageQuestionIds() {
    if (!this.q || !this.q.pages) return [];
    const discussionPages = this.q.pages.filter((p) => p.type === PageType.DISCUSSION_PAGE);
    const discussionPageQuestionIds = discussionPages.map((p) => (p as IDiscussionPage).questionId);
    return discussionPageQuestionIds;
  }


  get chatGroupQuestionIdMap(): (undefined | { [questionId: string]: { messages: any[] } }) {
    try {
      let map: { [questionId: string]: { messages: any[] } } = {};
      if (!this.selectedGroup) return undefined;
      const messages = this.selectedGroup.messages;
      if (!messages) return undefined;
      messages.forEach((m: any) => {
        if (map[m.questionId] === undefined) map[m.questionId] = { messages: [] };
        map[m.questionId].messages.push(m);
      });
      return map;
    } catch (e) {
      console.log(e);
    }
  }

  get selectedUser() {
    if (!this.selectedGroup) return undefined;
    this.selectedGroup.quizSessionIds
  }

  get groupQuizSessions() {
    if (!this.selectedGroup || !this.quizSessionMap) return [];
    const users = Object.keys(this.quizSessionMap).filter((qid) => this.selectedGroup!.quizSessionIds!.indexOf(qid) !== -1).map((quizSessionId) => {
      return this.quizSessionMap[quizSessionId]
    });

    return users || [];
  }
  // get quizSessionUserMap() {
  //   let map: { [questionId: string]: { messages: any[] } } = {};
  // }


  async fetchAllGroupQuizSessions() {
    if(this.chatGroups.length > 0) {
      await Promise.all(this.chatGroups.map(async (chatGroup: IChatGroup) => await this.fetchGroupQuizSessions(chatGroup)));
    } 
  }

  // async fetchQuizSessions() {
  //   try {

  //     console.log('Fetching sessions');
  //     if (!this.selectedGroup) return;
  //     const quizSessionPromises = await Promise.all((this.selectedGroup.quizSessionIds || []).map(async (qid) => {
  //       // Check if already loaded in memory
  //       if (this.quizSessionMap[qid] && this.quizSessionMap[qid].quizSession && this.quizSessionMap[qid].userSession) return;
  //       else {
  //         // Fetch
  //         const quizSessionResponse = await API.request(API.GET, (API.QUIZSESSION + "quizsession-marking/" + qid), {});
  //         const quizSession = quizSessionResponse.session as IQuizSession;
  //         this.quizSessionMap[qid] = { quizSession: quizSession, userSession: undefined, user: undefined, responses: [] };
  //         const userSessionResponse = await API.request(API.GET, API.USERSESSION + "marking/" + quizSession.userSessionId, {});
  //         this.quizSessionMap[qid].userSession = userSessionResponse;

  //         const userResponse = await API.request(API.GET, API.USER + "marking/" + userSessionResponse.userId, {});
  //         this.quizSessionMap[qid].user = userResponse;

  //         const responseResponse = await API.request(API.GET, API.RESPONSE + "/quizSession/" + qid, {});

  //         console.log('Response response');
  //         console.log(responseResponse);
  //         if (responseResponse.data) {
  //           this.quizSessionMap[qid].responses = responseResponse.data;
  //         }
  //       }
  //     }));


  //   } catch (e) {
  //     console.log('Could not fetch quiz session data');
  //   }
  // }


    async fetchGroupQuizSessions(chatGroup: IChatGroup) {
    try {

      console.log('Fetching sessions');
      if (!chatGroup) return;
      const quizSessionPromises = await Promise.all((chatGroup.quizSessionIds || []).map(async (qid) => {
        // Check if already loaded in memory
        if (this.quizSessionMap[qid] && this.quizSessionMap[qid].quizSession && this.quizSessionMap[qid].userSession) return;
        else {
          // Fetch
          const quizSessionResponse = await API.request(API.GET, (API.QUIZSESSION + "quizsession-marking/" + qid), {});
          const quizSession = quizSessionResponse.session as IQuizSession;
          this.quizSessionMap[qid] = { quizSession: quizSession, userSession: undefined, user: undefined, responses: [], marks: undefined };
          const userSessionResponse = await API.request(API.GET, API.USERSESSION + "marking/" + quizSession.userSessionId, {});
          this.quizSessionMap[qid].userSession = userSessionResponse;

          const userResponse = await API.request(API.GET, API.USER + "marking/" + userSessionResponse.userId, {});
          this.quizSessionMap[qid].user = userResponse;

          const responseResponse = await API.request(API.GET, API.RESPONSE + "/quizSession/" + qid, {});

          console.log('Response response');
          console.log(responseResponse);
          if (responseResponse.data) {
            this.quizSessionMap[qid].responses = responseResponse.data;
          } else {
            this.quizSessionMap[qid].responses = [];
          }

          // const marksResponse = await API.request(API.GET, API.MARKS + "/quizSession/" + qid, {});

          // if(marksResponse.data) {
          //   this.quizSessionMap[qid].marks = marksResponse.data;
          // }
        }
      }));


    } catch (e) {
      console.log('Could not fetch quiz session data');
    }
  }

  // @Watch('selectedGroupId')
  // async groupHandler() {
  //   await this.fetchQuizSessions();
  //     if (this.orderedDiscussionPageQuestionIds.length > 0) {
  //       this.selectedQuestionId = this.orderedDiscussionPageQuestionIds[0]
  //     }

  //     if (this.groupQuizSessions.length > 0) {
  //       this.selectedUsernameInChatGroup = this.groupQuizSessions[0].user!.username!;
  //     }
  // }

  // @Watch('selectedQuestionId')
  // async questionHandler() {
  //   await this.fetchQuizSessions();
  // }

  // @Watch('chatGroups.length')
  // async chatGroupHandler() {
  //   if (this.chatGroups.length > 0) {
  //     this.selectedGroupId = this.chatGroups[0]._id
  //   }
  // }

  // @Watch('orderedDiscussionPageQuestionIds.length')
  // async questionsHandler() {
  //   if (this.orderedDiscussionPageQuestionIds.length > 0) {
  //     this.selectedQuestionId = this.orderedDiscussionPageQuestionIds[0]
  //   }
  // }
  async created() {
    if (!this.q || !this.q._id) return;
    await this.$store.dispatch("getChatGroups", this.q._id);
    await this.fetchAllGroupQuizSessions();
    // if (this.chatGroups.length > 0) {
    //   this.selectedGroupId = this.chatGroups[0]._id
    // }


  }
}
</script>
<style scoped>
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

.marking {
  max-height: 90vh;
  overflow: scroll;
}

.marking-section {
  max-height: 80vh;
  overflow: scroll;
}
</style>