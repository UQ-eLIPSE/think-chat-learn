import Vue from "vue";
import Router from "vue-router";
import Landing from "./components/Landing.vue";
import Login from "./components/Login.vue";
import QuizPage from "./components/QuizPage.vue";
import QuestionPage from "./components/QuestionPage.vue";
import QuestionList from "./components/QuestionList.vue";
import QuizList from "./components/QuizList.vue";
import MarkQuiz from "./views/MarkQuiz.vue";
import Marking from './views/Marking.vue';

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
    name: 'mark-quiz',
    component: MarkQuiz
  }],
});
