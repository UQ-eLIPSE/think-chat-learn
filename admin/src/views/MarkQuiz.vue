<template>
  <v-container v-if="q">

    <v-layout row>
      <v-flex xs8>
        <h2>{{ q.title }}</h2>
      </v-flex>
      <v-flex>
        <v-layout row class="blue-cl-static quiz-info pa-2">
          <p class="mr-2"><b>Available Start:</b> {{ new Date(q.availableStart).toLocaleString() }}</p>
          <p><b>Available End:</b> {{ new Date(q.availableEnd).toLocaleString() }}</p>
        </v-layout>
      </v-flex>
    </v-layout>

    <div class="form-control my-2" v-if="marksPublic !== null">
      <v-layout row class="align-center">
        <input type="checkbox" v-model="marksPublic" class="mr-2" 
              @click.stop.prevent="toggleMarksVisibility">
        <span class="checkbox-label">Publish Marks? (If checked, marks will be displayed to students)</span>
      </v-layout>
    </div>

    <v-form class="form-control">

      <!--Search student component and group pagination-->
      <v-layout row class="align-center">
        <!--Search student input-->
        <v-flex class="search-field mr-4" xs3>
          <input type="search" placeholder="Search student">
        </v-flex>

        <!--Group pagination-->
        <v-flex class="groups card-container ma-0 py-1 px-8" xs8>
          <v-layout row class="align-center">
            <h3 class="ma-0">Group</h3>
            <div class="mx-auto">
              <Pagination :currentPage="(selectedGroupIndex + 1)" 
                          :totalPages="chatGroupsDropDown.length" 
                          :numPageButtons="numVisiblePagesButton" 
                          @pageChanged="changeGroupChat"
                          :isGroupMarking="true"
                          :groupList="groupMarkingPaginationList"/>
            </div>
          </v-layout>
        </v-flex>
      </v-layout>

      <v-container fluid grid-list-md class="pa-0 mt-2">
        <div class="form-control">
          <v-layout row>
            <!--Main panel-->
            <div class="card-container mr-3 ">
              
              <!--List of students in group-->
              <v-layout row class="users">
                <template v-for="(user, i) in currentGroupQuizSessionDropDown">
                  <UserCard v-if="user && user.text && user.value"
                    :key="`${user.text}-user`"
                    :studentId="user.text"
                    @click.native="setCurrentQuizSessionId(user.value)"
                    :numeral="i + 1"
                    :marked="checkIfUserQuizSessionMarked(user.value)"
                    :selected="currentQuizSessionId === user.value"/>
                </template>
              </v-layout>

              <div class="divider"></div>
              <!--Questions list and answers-->
              <v-flex xs12 class="marking-section">
                <div class="group-mark" v-if="selectedGroup">

                  <div class="question-discussion" v-if="selectedQuestion">

                    <div class="question-box" v-if="displayQuestionContent">
                      <span> Question Title:
                        <b>{{ selectedQuestion.title }}</b>
                      </span>
                      <div v-html="selectedQuestion.content"></div>
                    </div>

                    <span v-if="!isCurrentUserSelectedAndInGroup"><p>Please select a user</p></span>
                    <QuizSessionViewer v-if="selectedGroup && selectedQuestion && isCurrentUserSelectedAndInGroup"/>
                  </div>
                </div>
              </v-flex>
            </div>

            <!--Rubric and general feedback-->
            <MarkingComponent v-if="selectedGroup && selectedQuestion && isCurrentUserSelectedAndInGroup" 
                              class="marking-component"></MarkingComponent>

          </v-layout>
        </div>
      </v-container>
    </v-form>
  </v-container>
  <div v-else> Select a group from the dropdown list</div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage,
  IQuestionAnswerPage, IQuizSession, IChatGroupWithMarkingIndicator, IUserSession, IUser, QuizSessionDataObject } from "../../../common/interfaces/ToClientData";

import { PageType } from "../../../common/enums/DBEnums";
import QuizSessionViewer from '../components/QuizSessionViewer/QuizSessionViewer.vue';
import MarkingComponent from '../components/Marking/MarkingComponent.vue';
import { API } from "../../../common/js/DB_API";
import UserCard from "../components/Marking/UserCard.vue";
import Pagination from "../components/Pagination/Pagination.vue";
import { IPageNumber } from "../components/Pagination/PageNumber.vue";

Component.registerHooks([
  'beforeRouteEnter',
  'beforeRouteLeave',
  'beforeRouteUpdate' // for vue-router 2.2+
])

interface DropDownConfiguration {
  text: string,
  value: string,
}

@Component({
  components: {
    QuizSessionViewer,
    MarkingComponent,
    UserCard,
    Pagination
  }
})
export default class MarkQuiz extends Vue {
  private displayQuestionContent: boolean = false;
  private numVisiblePagesButton: number = 7;

  get marksPublic(): boolean | null | undefined {
    if(!this.q) return null;
    return this.q.marksPublic;
  }

  async toggleMarksVisibility() {
    // Check if marksPublic is not invalid
    if(this.marksPublic !== null && this.q && this.q._id) {
      await this.$store.dispatch('updateQuizMarksVisibility', {
        quizScheduleId: this.q._id,
        marksPublic: !(!!this.marksPublic) 
      });
    }
  }

  @Watch('selectedGroupId')
  async chatGroupIdChangeHandler() {
    const chatGroup = this.selectedGroup;
    if (chatGroup) {
      const quizSessionInfoPromises = (chatGroup.quizSessionIds || []).map(async (qs) => await this.$store.dispatch('getQuizSessionInfo', qs));

      await Promise.all(quizSessionInfoPromises);
    }

  }

  /**
   * Returns if a quiz session is marked
   * @param {string} quizSessionId Quiz session ID
   * @returns {boolean} `true` if marked, `false` if not marked
   */
  checkIfUserQuizSessionMarked(quizSessionId: string): boolean {
    if(!this.selectedGroup || !this.selectedGroup.quizSessionMarkedMap) return false;
    return this.selectedGroup.quizSessionMarkedMap[quizSessionId];
  }

  /**
   * Returns group marking array for pagination
   */
  get groupMarkingPaginationList(): IPageNumber[] {
    return this.chatGroups.map((chatGroup, i) => {
      const marked = chatGroup && chatGroup.quizSessionMarkedMap? Object.values(chatGroup.quizSessionMarkedMap).every((value) => value) : false;

      return {
        page: i + 1,
        marked: marked
      };

    });
  }

  goToChatgroup(chatGroupIndex: number, questionIndex: number, quizSessionIndex: number) {
    if (!this.chatGroups) return;
    if (!this.chatGroups[chatGroupIndex]) {
      this.selectedGroupId = this.chatGroups[0]._id ? this.chatGroups[0]._id : "";
      return;
    }
    this.selectedGroupId = this.chatGroups[chatGroupIndex]._id ? this.chatGroups[chatGroupIndex]._id! : "";

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

  get isCurrentUserSelectedAndInGroup() {
    if (!this.currentQuizSessionId || !this.currentGroupQuizSessionInfoObjects) return false;
    const existsInGroup = this.currentGroupQuizSessionInfoObjects.findIndex(o => o.quizSession._id === this.currentQuizSessionId)
    if (existsInGroup !== -1) return true;
    return false;
  }

  //Choosing group chat from pagination
  changeGroupChat(groupId: number){
    if (this.chatGroups.length <= 0) return;
    if (!groupId) {
      this.goToChatgroup(0, 0, 0);
    } else if (this.chatGroups.length > 1 && groupId > 0) {
      this.goToChatgroup(groupId - 1, 0, 0);
      this.goToQuestion(this.orderedDiscussionPageQuestionIds.length - 1, this.currentGroupQuizSessionInfoObjects.length - 1);
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
  get chatGroups(): IChatGroupWithMarkingIndicator[] {
    return this.$store.state.Quiz.chatGroups || [];
  }

  get chatGroupsDropDown(): DropDownConfiguration[] {
    return this.chatGroups.map((group, index) => {
      return {
        value: group._id ? group._id : "",
        text: `Group ${index + 1} (${group._id ? group._id : ""})`
      };
    });
  }

  get selectedGroup(): IChatGroupWithMarkingIndicator | undefined {
    if (!this.chatGroups || !this.selectedGroupId) return undefined;
    return this.chatGroups.find((g: any) => g._id === this.selectedGroupId);
  }

  get selectedGroupIndex(): number {
    if (!this.chatGroups || !this.selectedGroupId) return -1;
    const found = this.chatGroups.findIndex((g: any, idx: number) => g._id === this.selectedGroupId);
    return found !== -1 ? found: 0;
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

  get quizSessionInfoMap() {
    return this.$store.getters.quizSessionInfoMap;
  }

  get currentGroupQuizSessionInfoObjects(): any[] {
    return this.$store.getters.currentGroupQuizSessionInfoObjects;
  }

  get currentGroupQuizSessionDropDown(): DropDownConfiguration[] {
    return this.currentGroupQuizSessionInfoObjects.map((data) => {
      return {
        value: data.quizSession._id,
        text: data.user.username
      }
    });
  }

  get currentUserSessionInfo() {
    if (this.markingState.currentQuizSessionId) {
      return this.$store.getters.quizSessionInfoMap[this.markingState.currentQuizSessionId];
    }

    return null;
  }




  async fetchAllQuizSessionInfo(vm: any) {
    if (!vm.$route.params.id) return;
    // Quiz session marking data is being fetched in router for common routes

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
        const quizSessionIds = (<IChatGroupWithMarkingIndicator>currentChatGroup).quizSessionIds || [];
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

  setCurrentQuizSessionId(quizSessionId: string) {
    this.currentQuizSessionId = quizSessionId;
  }
  // async beforeRouteUpdate(to: any, from: any, next: any) {
  //   await this.fetchAllQuizSessionInfo(this);
  // }
}
</script>
<style lang="scss" scoped>

@import "../../css/app.scss";

.question-box {
  display: flex;
  flex-direction: column;
  border: 0.1em solid teal;
  padding: 0.5rem;
}

.marking-section {
  overflow-y: auto;
  max-height: 70vh;
}

.marking-rubric{
  position: sticky;
  top: 16px;
}

.quiz-info{
  border-radius: 5px;
  width: fit-content;
  flex: unset;

  > p {
    margin-bottom: 0;
    white-space: nowrap;
  }
}

.users {
  display: flex;
  width: 80%;
  flex-wrap: wrap;

  > * {
    margin: 0 0.25rem;
  }

}

.groups h3{
  color: $uq;
}

.divider{
  width: calc(100% + 4rem);
  margin-left: -2rem;
  margin-bottom: 0;
}
</style>