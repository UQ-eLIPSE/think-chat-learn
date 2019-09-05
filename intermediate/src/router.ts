import Vue from "vue";
import Router from "vue-router";
import Landing from "./views/Landing.vue";
import Login from "./views/Login.vue";

Vue.use(Router);
export const Names = {
  LANDING: "Landing",
  LOGIN: "Login",
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
    }
  ]
});
