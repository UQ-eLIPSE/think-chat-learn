import Vue from "vue";
import Router from "vue-router";
import Landing from "./components/Landing.vue";
import Login from "./components/Login.vue";
import QuizPage from "./components/QuizPage.vue";
import QuestionPage from "./components/QuestionPage.vue";
import QuestionList from "./components/QuestionList.vue";
import QuizList from "./components/QuizList.vue";
import MarkQuiz from "./views/MarkQuiz.vue";
import QuizMarkViewer from "./views/QuizMarkViewer.vue";
import Marking from './views/Marking.vue';
import MarkPlaceholder from './components/Marking/MarkPlaceholder.vue';
import store from './store';
import * as Schema from '../../common/interfaces/DBSchema';

Vue.use(Router);

// Note that the router config is done in the vue.config.js file
export default new Router({
  routes: [{
    path: "/",
    name: "landing",
    component: Landing
  }, {
    path: "/login",
    name: "Login",
    component: Login
  }, {
    path: "/quizPage",
    name: "Quiz Page",
    component: QuizPage,
    props: (route) => ({ id: route.query.q })
  }, {
    path: "/questionPage",
    name: "Question Page",
    component: QuestionPage,
    props: (route) => ({ id: route.query.q })
  }, {
    path: "/questionList",
    name: "Question List",
    component: QuestionList
  }, {
    path: "/quizList",
    name: "Quiz List",
    component: QuizList
  },
  {
    path: "/marking",
    name: "marking",
    component: Marking
  },
  {
    path: '/mark-quiz/:id',
    name: 'mark-quiz-main',
    component: MarkPlaceholder,
    children: [
      {
        path: 'mark',
        name: 'mark-quiz',
        component: MarkQuiz
      },
      {
        path: 'view-marks',
        name: 'view-mark-quiz',
        component: QuizMarkViewer
      }
    ],
    beforeEnter: async(to: any, from: any, next: any) => {
      try {
        if (!to.params.id) {
          // Error
          console.log('Quiz ID not present')
        }

        const quizId = to.params.id;
        store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuizId', value: quizId });
        store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuizSessionId', value: null });
        store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentQuestionId', value: null });
        store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentMarks', value: null });
        store.commit('UPDATE_CURRENT_MARKING_CONTEXT', { prop: 'currentChatGroupId', value: null });
        await store.dispatch("getChatGroups", quizId);
        
        next();
      } catch (e) {
        // TODO: Handle Errors
      }
    }
  }
  ]
});
