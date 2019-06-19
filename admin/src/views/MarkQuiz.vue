<template>
  <div id="quiz-mark-page"
       class="marking has-text-centered">
    <div v-if="q"
         class="container">
      <h3>Title: {{ q.title }}</h3>
      <span>Quiz ID: {{q._id}}</span>

      <span>Available Start: {{ new Date(q.availableStart).toString() }}</span>
      <span>Available End: {{ new Date(q.availableEnd).toString() }}</span>
    </div>


    <div class="select-row">
      <!-- <div class="group-select"> -->
      <label> Group
        <select v-model="selectedGroupId">
          <option v-for="(g, i) in chatGroups"
                  :value="g._id"
                  :key="g._id"> Group {{i + 1}} ({{g._id}})</option>
        </select>
      </label>
      <label v-if="selectedGroup && selectedQuestion">
        Current user
        <select v-model="currentQuizSessionId">
          <option v-for="s in currentGroupQuizSessionInfoObjects"
                  :key="s.quizSession._id"
                  :value="s.quizSession._id">{{ s.user.username }}</option>
        </select>
      </label>

    </div>
    <div class="step-navigation">
      <button type="button"
              class="button secondary"
              @click.prevent="previous">
        &lt; Previous</button>
      <button type="button"
              class="button secondary"
              @click.prevent="next">Next &gt;</button>
    </div>
    <div class="group-mark"
         v-if="selectedGroup">

      <div class="question-discussion"
           v-if="selectedQuestion">


        <div class="question-box"
             v-if="displayQuestionContent">
          <span> Question Title:
            <b>{{ selectedQuestion.title }}</b>
          </span>
          <div v-html="selectedQuestion.content"></div>
          </span>
        </div>

        <span class="info" v-if="!isCurrentUserSelectedAndInGroup">Please select a user</span>
        <MarkQuizMarkingSection v-if="selectedGroup && selectedQuestion && isCurrentUserSelectedAndInGroup"
                                class="marking-section" />
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
  private displayQuestionContent: boolean = false;

  @Watch('selectedGroupId')
  async chatGroupIdChangeHandler() {
    const chatGroup = this.selectedGroup;
    if (chatGroup) {
      const quizSessionInfoPromises = (chatGroup.quizSessionIds || []).map(async (qs) => await this.$store.dispatch('getQuizSessionInfo', qs));

      await Promise.all(quizSessionInfoPromises);
    }

  }
  goToChatgroup(chatGroupIndex: number, questionIndex: number, quizSessionIndex: number) {
    if (!this.chatGroups) return;
    if (!this.chatGroups[chatGroupIndex]) {
      this.selectedGroupId = this.chatGroups[0]._id;
      return;
    }
    this.selectedGroupId = this.chatGroups[chatGroupIndex]._id;

    this.goToQuestion(questionIndex, quizSessionIndex);
  }

  goToQuestion(questionIndex: number, quizSessionIndex: number) {
    if (!this.orderedDiscussionPageQuestionIds) return;
    if (!this.orderedDiscussionPageQuestionIds[questionIndex]) this.selectedQuestionId = this.orderedDiscussionPageQuestionIds[0];
    else this.selectedQuestionId = this.orderedDiscussionPageQuestionIds[questionIndex];
    // Set the quiz session id as the first
    this.goToQuizSession(quizSessionIndex);
  }

  goToQuizSession(index: number) {
    if (!this.currentGroupQuizSessionInfoObjects || this.currentGroupQuizSessionInfoObjects.length === 0) return;
    if (!this.currentGroupQuizSessionInfoObjects[index]) this.currentQuizSessionId = this.currentGroupQuizSessionInfoObjects[0].quizSession._id
    else this.currentQuizSessionId = this.currentGroupQuizSessionInfoObjects[index].quizSession._id;
  }

  next() {
    // Check from lowest level to highest level
    // Check if next user/quiz session available
    if (this.currentGroupQuizSessionInfoObjects.length > 0) {
      const quizSessionIndex = this.currentGroupQuizSessionInfoObjects.findIndex((s: any) => s.quizSession._id === this.currentQuizSessionId);
      if (quizSessionIndex === -1) {
        this.goToQuizSession(0);
        return;
      } else if (this.currentGroupQuizSessionInfoObjects.length > 1 && quizSessionIndex < this.currentGroupQuizSessionInfoObjects.length - 1) {
        // More than one quiz session exists, can move to the next one
        this.goToQuizSession(quizSessionIndex + 1);
        return;
      }
    }
    if (this.orderedDiscussionPageQuestionIds.length > 0) {
      // Check if next question available
      const questionIndex = this.orderedDiscussionPageQuestionIds.indexOf(this.selectedQuestionId);
      if (questionIndex === -1) {
        this.goToQuestion(0, 0);
        return;
      } else if (this.orderedDiscussionPageQuestionIds.length > 1 && questionIndex < this.orderedDiscussionPageQuestionIds.length - 1) {
        this.goToQuestion(questionIndex + 1, 0);
        return;
      }
    }

    if (this.chatGroups.length > 0) {
      const chatGroupIndex = this.chatGroups.findIndex((cg: IChatGroup) => cg._id === this.selectedGroupId);
      if (chatGroupIndex === -1) {
        this.goToChatgroup(0, 0, 0);
        return;
      } else if (this.chatGroups.length > 1 && chatGroupIndex < this.chatGroups.length - 1) {
        this.goToChatgroup(chatGroupIndex + 1, 0, 0);
        return;
      }
    }
  }

  get isCurrentUserSelectedAndInGroup() {
    if (!this.currentQuizSessionId || !this.currentGroupQuizSessionInfoObjects) return false;
    const existsInGroup = this.currentGroupQuizSessionInfoObjects.findIndex(o => o.quizSession._id === this.currentQuizSessionId)
    if (existsInGroup !== -1) return true;
    return false;
  }
  previous() {
    // Check from lowest level to highest level
    // Check if next user/quiz session available
    if (this.currentGroupQuizSessionInfoObjects.length > 0) {
      const quizSessionIndex = this.currentGroupQuizSessionInfoObjects.findIndex((s: any) => s.quizSession._id === this.currentQuizSessionId);
      if (quizSessionIndex === -1) {
        this.goToQuizSession(0);
        return;
      } else if (this.currentGroupQuizSessionInfoObjects.length > 1 && quizSessionIndex > 0) {
        // More than one quiz session exists, can move to the next one
        this.goToQuizSession(quizSessionIndex - 1);
        return;
      }
    }
    if (this.orderedDiscussionPageQuestionIds.length > 0) {
      // Check if next question available
      const questionIndex = this.orderedDiscussionPageQuestionIds.indexOf(this.selectedQuestionId);
      if (questionIndex === -1) {
        this.goToQuestion(0, 0);
        return;
      } else if (this.orderedDiscussionPageQuestionIds.length > 1 && questionIndex > 0) {
        this.goToQuestion(questionIndex - 1, 0);
        this.goToQuizSession(this.currentGroupQuizSessionInfoObjects.length - 1);
        return;
      }
    }

    if (this.chatGroups.length > 0) {
      const chatGroupIndex = this.chatGroups.findIndex((cg: IChatGroup) => cg._id === this.selectedGroupId);
      if (chatGroupIndex === -1) {
        this.goToChatgroup(0, 0, 0);
        return;
      } else if (this.chatGroups.length > 1 && chatGroupIndex > 0) {
        this.goToChatgroup(chatGroupIndex - 1, 0, 0);
        this.goToQuestion(this.orderedDiscussionPageQuestionIds.length - 1, this.currentGroupQuizSessionInfoObjects.length - 1);
        return;
      }
    }
  }
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

  get currentGroupQuizSessionInfoObjects(): any[] {
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
    // This is being done on the parent route now
    // vm.$store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuizId', value: vm.$route.params.id });

    // await vm.$store.dispatch("getChatGroups", vm.q._id);
    // const chatGroups = vm.$store.getters.chatGroups;
    // const chatGroupsInformationPromises = await Promise.all(chatGroups.map(async (g: IChatGroup) => {
    //   const chatGroupsQuizSessionPromises = await Promise.all((g!.quizSessionIds || []).map(async (qs) => {
    //     await vm.$store.dispatch("getQuizSessionInfo", qs);
    //   }));
    // }));

    const chatGroups = vm.$store.getters.chatGroups;
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
<style lang="scss" scoped>
@import "../../css/variables.scss";
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
  // max-height: 90vh;
  overflow: auto;
}

.marking-section {
  // max-height: 80vh;
  overflow: scroll;
}

.step-navigation {
  display: flex;
  justify-content: flex-end;
}

.step-navigation>* {
  margin: 0 0.25rem;
  width: 15%;
}

.quiz-mark-page {
  height: 100vh;
}

.select-row {
  display: flex;
  flex-wrap: wrap;
}

.select-row>* {
  margin: 0.25rem 0.5rem;
}
.info {
  font-size: 1.5em;
  color: #51247a; 
  font-weight: 400;
}
</style>