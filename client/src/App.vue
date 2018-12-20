<template>
  <div id="app">
    <side-nav/>
    <router-view id="routerpanel"/>
  </div>
</template>

<style lang="scss" scoped>

#app {
    font-family: 'Robot-Light', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100vh;
    width: 100vw;
    overflow: hidden;

    display: flex;
    flex-direction: row;
    flex-wrap: no-wrap;
}
#routerpanel{
    overflow-y: scroll;
}
</style>

<script lang="ts">
import {Vue, Component} from "vue-property-decorator";
import SideNav from "./components/SideNav.vue";
import { getIdToken, getLoginResponse } from "../../common/js/front_end_auth";
@Component({
  components: {
    SideNav,
  },
})
export default class App extends Vue {

  private mounted() {
    // Didn't login, attempt to refresh
    if (!this.$store.getters.user) {
      this.$store.dispatch("refreshToken").then(() => {
        // Set up the user again
        const login = getLoginResponse();

        // If there is no login response, then the action is to do nothing
        if (login) {
          this.$store.dispatch("setUser", login.user);
          this.$store.dispatch("setQuiz", login.quiz);
        }
      });
    }
  }

}
</script>
