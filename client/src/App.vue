<template>
  <div id="app">
    <Nav />
    <router-view id="routerpanel" />
    <Footer />
  </div>
</template>

<style lang="scss">
body {
  background-color: #f9fbfc;
  box-sizing: border-box;
  font-family: "Open Sans", sans-serif;
  margin: 0;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  #app {
    height: 100vh;
    max-width: 1970px;
    margin: 0 auto;
  }

  #routerpanel {
    overflow-y: scroll;
  }

  .center {
    text-align: center;
  }

  h1 {
    color: #005151;
    font-size: 2.25em;
    font-weight: 600;
  }

  button {
    border: none;
    border-radius: 5px;
    color: #fff;
    cursor: pointer;
    font-family: "Open Sans", sans-serif;
    font-size: 1.4em;
    font-weight: 600;
    height: 46px;
    min-width: 215px;
    padding: 0 30px;
    &:hover {
    }
    &.primary {
      background-color: #225566;
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { getIdToken, getLoginResponse } from "../../common/js/front_end_auth";
import Nav from "./components/Nav.vue";
import Footer from "./components/Footer.vue";
import Buefy from "buefy";
import "buefy/dist/buefy.css";
import "./styles.scss";

Vue.use(Buefy);

@Component({
  components: {
    Nav,
    Footer
  }
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
