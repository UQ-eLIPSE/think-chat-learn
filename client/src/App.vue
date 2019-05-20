<template>
  <div id="app">
    <Nav />
    <section>
      <template v-if="renderRestart">
        <div @click="restartSocket()">Restart</div>
      </template>
      <div class="info"><font-awesome-icon icon="info-circle" /> If you encounter connection issues with MOOCchat, close this window/tab and relaunch MOOCchat from Blackboard. (Your progress will be saved) </div>
      <GlobalMessage v-if="GlobalMessageExists"/>
      <Stepper steps=5 />
      <Timer />
      <div class="content-container">
        <router-view class="router-panel" />
      </div>
    </section>

    <Footer />
  </div>
</template>

<style lang="scss">
@import url("https://fonts.googleapis.com/css?family=Open+Sans");
@import "../css/variables.scss";


.info {
  width: 100%;
  position: relative;
  padding: .75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: .25rem;
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
}

html {
  body {
    font-family: "Open Sans", sans-serif !important;
    margin: 0;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    #app {
      background-color: $mainBg;
      height: 100%;
    }

    .center {
      text-align: center;
    }

    .margin-top {
      margin-top: 2em;
    }

    h1 {
      color: $primary;
      font-size: 1.75em;
      font-weight: 600;
      line-height: 45px;
      margin-bottom: 0.5em;
    }

    h2 {
      color: $primary;
      font-size: 1.75em;
      font-weight: 600;
      margin-bottom: 0.5em;
    }

    h3 {
      color: $primary;
      font-size: 1.25em;
      font-weight: 600;
      margin-bottom: 0.5em;
    }

    a {
      color: $text;
      cursor: pointer;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    button {
      border: none;
      border-radius: 5px;
      color: $white;
      cursor: pointer;
      font-family: "Open Sans", sans-serif;
      font-size: 1.4em;
      font-weight: 600;
      height: 46px;
      min-width: 215px;
      padding: 0 30px;

      &.primary {
        background-color: $primary;
      }

      &.secondary {
        background-color: $baseLight3;
        height: 40px;
        width: 100%;
      }
    }
    section {
      margin-bottom: 150px;
      min-height: calc(100vh - 321px);
      padding-top: 25px;

      .content-container {
        background-color: $white;
        border-radius: 5px;
        bottom: 0;
        box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.15);
        left: 0;
        max-width: 1570px;
        margin: 1em auto 1em auto;
        width: 85%;
      }
    }

    // Buefy overrides
    .b-radio.radio input[type="radio"]:checked + .check {
      border-color: $baseLight3;
    }
    .b-radio.radio input[type="radio"] + .check:before {
      background: $baseLight3;
    }
    .b-radio.radio input[type="radio"] + .check:hover {
      border: 2px solid $baseLight3;
    }
    .b-radio.radio:hover input[type="radio"] + .check {
      border-color: $baseLight3;
    }
    .textarea:focus,
    .textarea.is-focused,
    .textarea:active,
    .textarea.is-active {
      border-color: $baseLight3;
      box-shadow: 0 0 0 0.125em rgba(254, 173, 0, 0.25);
    }
    .switch:focus input[type="checkbox"]:checked + .check {
      box-shadow: 0 0 0.5em rgba(254, 173, 0, 0.8);
    }
    .switch:hover input[type="checkbox"]:checked + .check {
      background: rgba(254, 173, 0, 0.9);
    }
    .switch input[type="checkbox"]:checked + .check {
      background: $baseLight3;
    }
    .tooltip.is-left.is-primary.disabled:before {
      border-left: 5px solid $baseLight1;
    }
    .tooltip.is-left.is-primary.active:before {
      border-left: 5px solid $baseLight2;
    }
    .tooltip.is-primary.disabled:after {
      background: $baseLight1;
      color: $white;
    }
    .tooltip.is-primary.active:after {
      background: $baseLight2;
      color: $white;
    }

    // Countdown Timer styling
    .vuejs-countdown {
      background-color: rgba(96, 175, 161, 0.1);
      border: 3px solid $baseDark1;
      border-radius: 5px;
      color: $baseDark1;
      font-size: 20px;
      height: 50px;
      margin: 0 auto;
      text-align: center;
      width: 250px;
      li {
        &:first-child {
          display: none;
        }
        p {
          &.text {
            display: none;
          }
        }
      }
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { getIdToken, getLoginResponse } from "../../common/js/front_end_auth";
import Nav from "./components/Nav.vue";
import Stepper from "./components/Stepper.vue";
import Footer from "./components/Footer.vue";
import Timer from "./components/Timer/Timer.vue";
import GlobalMessage from "./components/GlobalMessage.vue";

@Component({
  components: {
    Nav,
    Stepper,
    Timer,
    Footer,
    GlobalMessage
  }
})
export default class App extends Vue {
  private renderRestart = false;

  private restartSocket() {
    this.$store.getters.socketState.socket.restart();
  }

  get GlobalMessageExists() {
    const globalMessage = this.$store.state.systemMessage;
    return globalMessage && globalMessage.message;
  }
}
</script>
