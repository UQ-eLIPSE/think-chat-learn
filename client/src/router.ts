import Vue from "vue";
import Router, { Route } from "vue-router";
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

const names = {
  LANDING: "Landing",
  MOOCCHAT_PAGE: "MoocChatPage",
  DISCUSSION: "Discussion",
  REFLECTION: "Reflection",
  SURVEY: "Survey",
  FINISH: "Finish",
  LOGIN: "Login",
  GROUP_ALLOCATION: "Group Allocation",
  RECEIPT: "Receipt"
};

// Note that the router config is done in the vue.config.js file
export const router = new Router({
  routes: [
    {
      path: "/",
      name: names.LANDING,
      component: Landing
    },
    {
      path: "/page",
      name: names.MOOCCHAT_PAGE,
      component: MoocChatPage
    },
    {
      path: "/discussion",
      name: names.DISCUSSION,
      component: Discussion
    },
    {
      path: "/reflection",
      name: names.REFLECTION,
      component: Reflection
    },
    {
      path: "/survey",
      name: names.SURVEY,
      component: Survey
    },
    {
      path: "/finish",
      name: names.FINISH,
      component: Finish
    },
    {
      path: "/login",
      name: names.LOGIN,
      component: Login
    },
    {
      path: "/allocation",
      name: names.GROUP_ALLOCATION,
      component: GroupAllocation
    }, {
      path: "/receipt",
      name: names.RECEIPT,
      component: Receipt
    }
  ]
});

const store = new Vue().$store;

// This somewhat replicates the fsm that is used in previous versions
// Will need to use the store to validate group allocation movements
// I.e. can only direct to the page from allocation once a group is formed
function checkValidTransition(to: Route, from: Route): boolean {
  // Checking if the transitions are valid

  // The known transitions are
  // login -> landing
  // landing -> page
  // page -> allocation
  // allocation -> page
  // page -> receipt

  // Note the initial login is always null
  if ((from.name === null && to.name === names.LOGIN) ||
    (from.name === names.LOGIN && to.name === names.LANDING) ||
    (from.name === names.LANDING && to.name === names.MOOCCHAT_PAGE) ||
    (from.name === names.MOOCCHAT_PAGE) && to.name === names.GROUP_ALLOCATION ||
    (from.name === names.GROUP_ALLOCATION && to.name === names.MOOCCHAT_PAGE) ||
    (from.name === names.MOOCCHAT_PAGE && to.name === names.RECEIPT)) {
    return true;
  }
  return false;
}

router.beforeEach((to, from, next) => {
  if (checkValidTransition(to, from)) {
    return next();
  } else {
    return;
  }
});
