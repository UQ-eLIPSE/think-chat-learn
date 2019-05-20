import Vue from "vue";
import App from "./App.vue";
import { router } from "./router";
import store from "./store";
import Buefy from "buefy";
import "buefy/dist/buefy.css";
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
  faArrowLeft,
  faInfoCircle,
  faCheckCircle
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
  faArrowLeft,
  faInfoCircle,
  faCheckCircle
);

Vue.use(Buefy);
Vue.component("font-awesome-icon", FontAwesomeIcon);
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount("#app");
