<template>
  <div>
    <h1>Grades and Feedback</h1>
    <template v-if="quizSession && quiz">
      <h2>{{quiz.title}}</h2>
      <h4>{{ new Date(quizSession.startTime) }}</h4>

      <h3>Grades</h3>
      <table>
        <thead>
          <th>Criterion</th>
          <th>Score</th>
          <th>Feedback</th>
        </thead>
        <tbody>
          <tr v-for=""></tr>
        </tbody>
      </table>
    </template>
    
  </div>
</template>

<style lang="scss" scoped>
</style>

<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import {
  IUser,
  IQuiz,
  IQuizSession,
  IUserSession,
} from "../../../common/interfaces/ToClientData";
import OverviewContainer from "../components/OverviewContainer.vue";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../../common/interfaces/IWSToServerData";
import { SocketState, TimerSettings } from "../interfaces";
import { WebsocketManager } from "../../../common/js/WebsocketManager";
import { WebsocketEvents } from "../../../common/js/WebsocketEvents";
import { EventBus } from "../EventBus";
import { EmitterEvents } from "../emitters";
import { PastQuizSession } from "../views/Landing.vue";
import { IRubric } from "../../../common/interfaces/ToClientData";
import { ICriteria, Mark } from "../../../common/interfaces/DBSchema";

export type IRubricCriteria = Omit<IRubric, 'criterias'> & { criteria: ICriteria[] };

@Component
export default class Feedback extends Vue {
  @Prop({ default: undefined, required: true }) private quizSession!: PastQuizSession;
  @Prop({ default: undefined }) private marks!: any;
  @Prop({ default: undefined }) private responses!: any;
  @Prop({ default: undefined }) private rubric!: IRubricCriteria;


  get quiz() {
    return this.quizSession && this.quizSession.quiz;
  }

  get markRows() {
    if(!this.marks || !this.rubric) return;
    
  }

  async fetchRubricWithCriteria(rubricId: string): Promise<IRubricCriteria | undefined> {
    // TODO: Make network request

    try {
        return { name: 'rubric', course: 'ENGG1234', criteria: [
        {
          "_id":"5f44b66a261ab5499566b72c", 
          "name":"evaluating",
          "description":"How well one evaluates",
          "course":"ENGG1234"
        },
        {"_id": "5f44b66a261ab5499566b72d","name":"interpreting","description":"How well one interprets","course":"ENGG1234"}, 
        {"_id": "5f44b66a261ab5499566b72e","name":"analysing","description":"How well one analyses","course":"ENGG1234"}
      ]};
    } catch(e) {

    }
    
  }

  async fetchMarksForQuizSessionId(quizSessionId: string): Promise<Mark| undefined> {
    // TODO: Make network request

    try {
      return {"_id": "5f460413c47d51831e7cac0d", "quizSessionId":"5f4603d4c47d51831e7cac09","markerId":"5f44be6a0a18f3520fd76675","userId":"5f44be6a0a18f3520fd76675","username":"asedqweqeqwewqwenaewsqasqedweasd","markerUsername":"asedqweqeqwewqwenaewsqasqedweasd","timestamp": new Date("2020-08-26T06:41:23.359Z"),"quizId":"5f44b6c0261ab5499566b738","marks":[{"value":2,"criteriaId":"5f44b66a261ab5499566b72c"}],"feedback":""} 
    } catch (e) {

    }
  }

  async mounted() {
    if(this.quizSession && this.quizSession._id && this.quizSession.quiz && this.quizSession.quiz.rubricId && this.quizSession.overallScore) {
      // get rubric with pre-loaded criteria
      // TODO: Make network requests
      const rubric: IRubricCriteria = await this.fetchRubricWithCriteria(this.quizSession.quiz.rubricId);

      // Check if rubric exists in database AND marks have been assigned to user
      if(rubric) this.rubric = rubric;
    
      // get marks
      const marks = await this.fetchMarksForQuizSessionId(this.quizSession._id);
    
      if(marks) this.marks = marks;
    }
  }
  
}
</script>
