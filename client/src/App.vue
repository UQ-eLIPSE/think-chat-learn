<template>
  <div id="app">
    <Nav />
    <section>
      <div class="content-container">
        <router-view class="router-panel" />
      </div>
    </section>
    <Footer />
  </div>
</template>

<style lang="scss">
body {
  background-color: #fff;
  font-family: "Open Sans", sans-serif;
  margin: 0;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  #app {
    height: 86vh;
    // max-width: 1970px;
    // margin: 0 auto;
  }

  .center {
    text-align: center;
  }

  .margin-top {
    margin-top: 2em;
  }

  h1 {
    color: #005151;
    font-size: 2.25em;
    font-weight: 600;
    line-height: 45px;
    margin-bottom: 0.5em;
  }

  h2 {
    color: #005151;
    font-size: 1.75em;
    font-weight: 600;
    margin-bottom: 0.5em;
  }

  h3 {
    color: #005151;
    font-size: 1.25em;
    font-weight: 600;
    margin-bottom: 0.5em;
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
    margin-right: 1em;
    padding: 0 30px;
    &:hover {
    }
    &.primary {
      background-color: #225566;
    }
  }
  section {
    background-color: #f9fbfc;
    height: 100%;
    padding-top: 6em;

    .content-container {
      background-color: white;
      border-radius: 5px;
      bottom: 0;
      box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.15);
      left: 0;
      max-width: 1570px;
      margin: 0 auto;
    }
  }

  // Buefy overrides
  .b-radio.radio input[type="radio"]:checked + .check {
    border-color: #fead00;
  }
  .b-radio.radio input[type="radio"] + .check:before {
    background: #fead00;
  }
  .b-radio.radio input[type="radio"] + .check:hover {
    border: 2px solid #fead00;
  }
  .b-radio.radio:hover input[type="radio"] + .check {
    border-color: #fead00;
  }
  .textarea:focus,
  .textarea.is-focused,
  .textarea:active,
  .textarea.is-active {
    border-color: #fead00;
    box-shadow: 0 0 0 0.125em rgba(254, 173, 0, 0.25);
  }
  .switch:focus input[type="checkbox"]:checked + .check {
    box-shadow: 0 0 0.5em rgba(254, 173, 0, 0.8);
  }
  .switch:hover input[type="checkbox"]:checked + .check {
    background: rgba(254, 173, 0, 0.9);
  }
  .switch input[type="checkbox"]:checked + .check {
    background: #7957d5;
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
