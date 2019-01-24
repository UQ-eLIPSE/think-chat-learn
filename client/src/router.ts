import Vue from "vue";
import Router from "vue-router";
import Landing from "./views/Landing.vue";
import MoocChatPage from "./views/MoocChatPage.vue";
import Discussion from "./views/Discussion.vue";
import Reflection from "./views/Reflection.vue";
import Survey from "./views/Survey.vue";
import Finish from "./views/Finish.vue";
import Login from "./views/Login.vue";
import GroupAllocation from "./views/GroupAllocation.vue";
import Receipt from "./views/Receipt.vue";

Vue.use(Router);

// Note that the router config is done in the vue.config.js file
export default new Router({
  routes: [
    {
      path: "/",
      name: "landing",
      component: Landing
    },
    {
      path: "/page",
      name: "MoocChatPage",
      component: MoocChatPage
    },
    {
      path: "/discussion",
      name: "Discussion",
      component: Discussion
    },
    {
      path: "/reflection",
      name: "Reflection",
      component: Reflection
    },
    {
      path: "/survey",
      name: "Survey",
      component: Survey
    },
    {
      path: "/finish",
      name: "Finish",
      component: Finish
    },
    {
      path: "/login",
      name: "Login",
      component: Login
    },
    {
      path: "/allocation",
      name: "Group Allocation",
      component: GroupAllocation
    }, {
      path: "/receipt",
      name: "Receipt",
      component: Receipt
    }
  ]
});
