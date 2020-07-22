import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
// Library imports
import Buefy from "buefy";
import Vuetify from "vuetify";
// CSS imports
import "buefy/dist/buefy.css";
import 'vuetify/dist/vuetify.min.css'

// Global TinyMCE skins
// import "tinymce/skins/lightgray/skin.min.css";
// import "tinymce/skins/lightgray/content.min.css";
// import "tinymce/skins/lightgray/content.inline.min.css";
// import "./static/prism/prism.css";


// TinyMCE
import "tinymce";
import "tinymce/plugins/print/plugin.min.js";
import "tinymce/plugins/image/plugin.min.js";
import "tinymce/plugins/table/plugin.min.js";
import "tinymce/plugins/lists/plugin.min.js"
import "tinymce/plugins/advlist/plugin.min.js";
import "tinymce/plugins/codesample/plugin.min.js";

import "tinymce/plugins/media/plugin.js";
// import "tinymce/plugins/mediaembed/plugin.js";
import "tinymce/plugins/pagebreak/plugin.js";
import "tinymce/plugins/wordcount/plugin.js";

import "tinymce/plugins/searchreplace/plugin.js";
import "tinymce/plugins/preview/plugin.js";

import "tinymce/plugins/help/plugin.js";
import "tinymce/plugins/textpattern/plugin.js";
import "tinymce/plugins/colorpicker/plugin.js";
import "tinymce/plugins/contextmenu/plugin.js";
import "tinymce/plugins/textcolor/plugin.js";
import "tinymce/plugins/insertdatetime/plugin.js";
import "tinymce/plugins/toc/plugin.js";
import "tinymce/plugins/hr/plugin.js";
import "tinymce/plugins/charmap/plugin.js";
import "tinymce/plugins/link/plugin.js";
import "tinymce/plugins/fullscreen/plugin.js";
import "tinymce/plugins/directionality/plugin.js";
import "tinymce/plugins/autolink/plugin.js";
import "tinymce/plugins/code/plugin.js";
import "tinymce/plugins/noneditable/plugin.js";
import "tinymce/plugins/paste/plugin.js";

import "tinymce/skins/ui/oxide/content.min.css";
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/icons/default/icons.js";
import "tinymce/themes/silver/theme";

// Katex CSS
import "katex/dist/katex.min.css";

Vue.use(Vuetify);
Vue.use(Buefy);
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount("#app");
