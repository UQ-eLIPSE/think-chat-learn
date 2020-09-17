import Vue from "vue";
import Router from "vue-router";
import Landing from "./views/Landing.vue";
import Login from "./views/Login.vue";
import FeedbackLauncher from "./views/FeedbackLauncher.vue";

Vue.use(Router);
export const Names = {
  LANDING: "Landing",
  LOGIN: "Login",
  FEEDBACK_LAUNCHER: 'Sessions and Feedback'
};

// Note that the router config is done in the vue.config.js file
export const router = new Router({
  routes: [
    {
      path: "/",
      name: Names.LANDING,
      component: Landing
    },
    {
      path: "/login",
      name: Names.LOGIN,
      component: Login
    },
    {
      path: "/feedback-launcher",
      name: Names.FEEDBACK_LAUNCHER,
      component: FeedbackLauncher,
      meta: {
        title: "TCL Sessions and Feedback"
      },
    }
  ]
});
