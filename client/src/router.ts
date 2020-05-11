import Vue from "vue";
import Router, { Route } from "vue-router";
import Landing from "./views/Landing.vue";
import Discussion from "./views/Discussion.vue";
import Reflection from "./views/Reflection.vue";
import Survey from "./views/Survey.vue";
import Login from "./views/Login.vue";
import GroupAllocation from "./views/GroupAllocation.vue";
import Receipt from "./views/Receipt.vue";

Vue.use(Router);
export const Names = {
  LANDING: "Landing",
  PAGE: "Page",
  DISCUSSION: "Discussion",
  REFLECTION: "Reflection",
  SURVEY: "Survey",
  LOGIN: "Login",
  GROUP_ALLOCATION: "Group Allocation",
  RECEIPT: "Receipt"
};

// Note that the router config is done in the vue.config.js file
export const router = new Router({
  routes: [
    {
      path: "/",
      name: Names.LANDING,
      component: Landing,
      meta: {
        title: "Think.Chat.Learn"
      },
    },
    {
      path: "/discussion",
      name: Names.DISCUSSION,
      component: Discussion,
      meta: {
        title: "Think.Chat.Learn - Discussion"
      },
    },
    {
      path: "/reflection",
      name: Names.REFLECTION,
      component: Reflection,
      meta: {
        title: "Think.Chat.Learn - Reflection"
      },
    },
    {
      path: "/survey",
      name: Names.SURVEY,
      component: Survey,
      meta: {
        title: "Think.Chat.Learn - Survey"
      },
    },
    {
      path: "/login",
      name: Names.LOGIN,
      component: Login,
      meta: {
        title: "Think.Chat.Learn - Login"
      },
    },
    {
      path: "/allocation",
      name: Names.GROUP_ALLOCATION,
      component: GroupAllocation,
      meta: {
        title: "Think.Chat.Learn - Allocation"
      },
    },
    {
      path: "/receipt",
      name: Names.RECEIPT,
      component: Receipt,
      meta: {
        title: "Think.Chat.Learn - Receipt"
      },
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
  if (
    (from.name === null && to.name === Names.LOGIN) ||
    (from.name === Names.LOGIN && to.name === Names.LANDING) ||
    (from.name === Names.LANDING && to.name === Names.PAGE) ||
    (from.name === Names.PAGE && to.name === Names.GROUP_ALLOCATION) ||
    (from.name === Names.GROUP_ALLOCATION && to.name === Names.PAGE) ||
    (from.name === Names.PAGE && to.name === Names.RECEIPT)
  ) {
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
