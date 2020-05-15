import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
// Library imports
import Buefy from "buefy";
import Vuetify from "vuetify";
// CSS imports
import "buefy/dist/buefy.css";
import "vuetify/dist/vuetify.min.css";
Vue.use(Vuetify);
Vue.use(Buefy);
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount("#app");
