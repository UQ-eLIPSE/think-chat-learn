import Vue from "vue";
import Router from "vue-router";
import Landing from "./components/Landing.vue";
import Login from "./components/Login.vue";
import CreateQuiz from "./components/CreateQuiz.vue";
import CreateQuestion from "./components/CreateQuestion.vue";

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
    path: "/createQuiz",
    name: "Create Quiz",
    component: CreateQuiz
  }, {
    path: "/createQuestion",
    name: "Create Question",
    component: CreateQuestion
  }],
});
