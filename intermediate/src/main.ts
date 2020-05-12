import Vue from "vue";
import App from "./App.vue";
import { router } from "./router";
import store from "./store";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";
import { library } from "@fortawesome/fontawesome-svg-core";

import {
  faChalkboard,
  faCircle,
  faCheck,
  faComment,
  faExclamationCircle,
  faPrint,
  faRedoAlt,
  faStar,
  faCommentDots,
  faArrowRight,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(
  faChalkboard,
  faCircle,
  faCheck,
  faComment,
  faExclamationCircle,
  faPrint,
  faRedoAlt,
  faStar,
  faCommentDots,
  faArrowRight,
  faArrowLeft
);

Vue.use(Vuetify);
Vue.component("font-awesome-icon", FontAwesomeIcon);
Vue.config.productionTip = false;

const vuetifyOptions = { };

new Vue({
  router,
  store,
  vuetify: new Vuetify(vuetifyOptions),
  render: (h) => h(App)
}).$mount("#app");
