import Vue from "vue";
import Router from "vue-router";
import Landing from "./components/Landing.vue";
import InitialAnswer from "./components/InitialAnswer.vue";
import Discussion from "./components/Discussion.vue";
import Reflection from "./components/Reflection.vue";
import Survey from "./components/Survey.vue";
import Finish from "./components/Finish.vue";

Vue.use(Router);

export default new Router({
  routes: [{
    path: "/",
    name: "landing",
    component: Landing
  }, {
    path: "/initial-answer",
    name: "Initial Answer",
    component: InitialAnswer
  }, {
    path: "/discussion",
    name: "Discussion",
    component: Discussion
  }, {
    path: "/reflection",
    name: "Reflection",
    component: Reflection
  }, {
    path: "/survey",
    name: "Survey",
    component: Survey
  }, {
    path: "/finish",
    name: "Finish",
    component: Finish
  }],
});
