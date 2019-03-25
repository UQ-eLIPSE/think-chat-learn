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

        <label>
          Current user
          <select v-model="currentQuizSessionId">
            <option v-for="s in currentGroupQuizSessionInfoObjects"
                    :key="s.quizSession._id"
                    :value="s.quizSession._id">{{ s.user.username }}</option>
          </select>
        </label>

        <MarkQuizMarkingSection class="marking-section" />
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

Component.registerHooks([
  'beforeRouteEnter',
  'beforeRouteLeave',
  'beforeRouteUpdate' // for vue-router 2.2+
])

@Component({
  components: {
    MarkQuizMarkingSection
  }
})
export default class MarkQuiz extends Vue {


  get markingState() {
    return this.$store.getters.currentMarkingContext;
  }

  get currentQuizSessionId() {
    return this.markingState.currentQuizSessionId;
  }

  set currentQuizSessionId(id: string) {
    this.$store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuizSessionId', value: id });
  }
  get selectedGroupId() {
    return this.markingState.currentChatGroupId;
  }

  set selectedGroupId(groupId: string) {
    this.$store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentChatGroupId', value: groupId });
  }

  get selectedQuestionId() {
    return this.markingState.currentQuestionId;
  }

  set selectedQuestionId(questionId: string) {
    this.$store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuestionId', value: questionId });
  }
  get q() {
    if (!this.$route.params.id) return null;
    return this.quizzes.find((q) => q._id === this.$route.params.id);
  }
  get quizzes(): IQuiz[] {
    return this.$store.getters.quizzes || [];
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

  changeQuizSession() {

  }
  get selectedUser() {
    if (!this.selectedGroup) return undefined;
    this.selectedGroup.quizSessionIds
  }

  get quizSessionInfoMap() {
    return this.$store.getters.quizSessionInfoMap;
  }
  // get groupQuizSessions() {
  //   // if (!this.selectedGroup || !this.quizSessionMap) return [];
  //   // const users = Object.keys(this.quizSessionMap).filter((qid) => this.selectedGroup!.quizSessionIds!.indexOf(qid) !== -1).map((quizSessionId) => {
  //   //   return this.quizSessionMap[quizSessionId]
  //   // });

  //   // return users || [];
  //   try {
  //     if (this.quizSessionInfoMap && this.selectedGroup) {
  //       return Object.keys(this.quizSessionInfoMap).filter((quizSessionId) => this.selectedGroup!.quizSessionIds!.indexOf(quizSessionId) !== -1).map((q) => this.quizSessionInfoMap[q]);
  //     } else {
  //       return [];
  //     }
  //   } catch (e) {
  //     return [];
  //   }
  // }

  get currentGroupQuizSessionInfoObjects() {
    return this.$store.getters.currentGroupQuizSessionInfoObjects;
  }

  get currentUserSessionInfo() {
    if (this.markingState.currentQuizSessionId) {
      return this.$store.getters.quizSessionInfoMap[this.markingState.currentQuizSessionId];
    }

    return null;
  }

  async fetchAllQuizSessionInfo(vm: any) {
      if (!vm.$route.params.id) return;
      vm.$store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuizId', value: vm.$route.params.id });

      await vm.$store.dispatch("getChatGroups", vm.q._id);
      const chatGroups = vm.$store.getters.chatGroups;
      const chatGroupsInformationPromises = await Promise.all(chatGroups.map(async (g: IChatGroup) => {
        const chatGroupsQuizSessionPromises = Promise.all((g!.quizSessionIds || []).map(async (qs) => {
          await vm.$store.dispatch("getQuizSessionInfo", qs);
        }));
      }));

      // Set up initial state
      if (!vm.$store.getters.currentMarkingContext.currentChatGroupId) {

        if (chatGroups && chatGroups.length > 0) {
          vm.selectedGroupId = chatGroups[0]._id;
          vm.$store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentChatGroupId', value: chatGroups[0]._id });
        }

        const questionsIds = vm.orderedDiscussionPageQuestionIds;
        if (questionsIds && questionsIds.length > 0) {
          vm.selectedQuestionId = questionsIds[0];
          vm.$store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuestionId', value: questionsIds[0] });
        }

        const currentChatGroup = vm.selectedGroup;
        if (currentChatGroup) {
          const quizSessionIds = (<IChatGroup>currentChatGroup).quizSessionIds || [];
          if (quizSessionIds.length > 0) {
            const currentQuizSessionIdBeingMarked = quizSessionIds[0];
            vm.$store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuizSessionId', value: currentQuizSessionIdBeingMarked });
          }

        }

      }
  }
  async beforeRouteEnter(to: any, from: any, next: any) {
    next(async (vm: any) => {
      await vm.fetchAllQuizSessionInfo(vm);

    });
  }

  // async beforeRouteUpdate(to: any, from: any, next: any) {
  //   await this.fetchAllQuizSessionInfo(this);
  // }
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