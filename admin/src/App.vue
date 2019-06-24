<template>
  <v-app>
    <v-navigation-drawer permanent app>
      <v-toolbar flat>
        <v-list>
          <v-list-tile>
            <v-list-tile-title class="title">
              MoocChat - {{course}}
            </v-list-tile-title>            
          </v-list-tile>
        </v-list>
      </v-toolbar>
      <v-divider></v-divider>
      <v-list class="pt-0">
        <v-list-tile v-for="item in sideNavItems" :key="item.name" @click="goToRoute(item.route)">
          <v-list-tile-action>
            <v-icon>{{item.icon}}</v-icon>
          </v-list-tile-action>            
          <v-list-tile-content>
            <v-list-tile-title>{{item.name}}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>   
      </v-list>
    </v-navigation-drawer>
    <v-content>
      <router-view/>
    </v-content>
  </v-app>
</template>

<style lang="scss">
@import "../css/variables.scss";
#app {
  // font-family: "Roboto-Light", sans-serif;
  // -webkit-font-smoothing: antialiased;
  // -moz-osx-font-smoothing: grayscale;
  // height: 100vh !important;
  width: 100vw;
  // overflow: hidden;
  overflow: auto;

  display: flex;
  flex-direction: row;
  // flex-wrap: nowrap;
}

#routerpanel {
  // overflow-y: scroll;
  // width: calc(100% - 20rem);
  // max-height: 100%;
  // overflow: scroll;
  //width: calc(100% - 20rem);
}

select {
  padding: 0.5rem;
  font-size: 1rem;
}

html {
  background-color: #f9fbfc;
  body {
    font-family: "Open Sans", sans-serif !important;
    margin: 0;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    #app {
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
      font-size: 1em;
      font-weight: 400;
      height: 30px;
      min-width: 150px;
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
      background-color: $mainBg;
      height: 100%;
      padding-top: 25px;

      @media (min-width: 1685px) {
        height: calc(100vh - 171px);
      }

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
    } // Buefy overrides
    .b-radio.radio input[type="radio"]:checked+.check {
      border-color: $baseLight3;
    }
    .b-radio.radio input[type="radio"]+.check:before {
      background: $baseLight3;
    }
    .b-radio.radio input[type="radio"]+.check:hover {
      border: 2px solid $baseLight3;
    }
    .b-radio.radio:hover input[type="radio"]+.check {
      border-color: $baseLight3;
    }
    .textarea:focus,
    .textarea.is-focused,
    .textarea:active,
    .textarea.is-active {
      border-color: $baseLight3;
      box-shadow: 0 0 0 0.125em rgba(254, 173, 0, 0.25);
    }
    .switch:focus input[type="checkbox"]:checked+.check {
      box-shadow: 0 0 0.5em rgba(254, 173, 0, 0.8);
    }
    .switch:hover input[type="checkbox"]:checked+.check {
      background: rgba(254, 173, 0, 0.9);
    }
    .switch input[type="checkbox"]:checked+.check {
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
    } // Countdown Timer styling
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
import { Snackbar } from 'buefy/dist/components/snackbar'
import { EventBus, EventList, SnackEvent } from "./EventBus";
import SideNav from "./components/SideNav.vue";

// Temporary interface for the side nav
interface SideNavItem {
  icon: string,
  name: string,
  route: string
}

const SideNavItems: SideNavItem[] = [
  {
    icon: "home",
    name: "Welcome",
    route: "/"
  }, {
    icon: "done",
    name: "Marking",
    route: "/marking"
  },
  {
    icon: "book",
    name: "Quiz List",
    route: "/quizList"
  },
  {
    icon: "question_answer",
    name: "Question List",
    route: "/questionList"
  },
  {
    icon: "list",
    name: "View Criteria List",
    route: "/criteria"
  },
  {
    icon: "view_list",
    name: "View Rubric List",
    route: "/rubric"
  }
]

@Component({
  components: {
    SideNav
  }
})
export default class App extends Vue {

  get sideNavItems() {
    return SideNavItems;
  }

  // Fetch the course for generic display
  get course() {
    return this.$store.state.Quiz.course || '';
  }  

  // Goes to the particular route
  private goToRoute(path: string) {
    this.$router.push(path);
  }

  // Given a string payload, push that to the snackbar
  private handlePushSnackBar(data: SnackEvent) {
    Snackbar.open({
      message: data.message,
      type: data.error ? 'is-danger' : 'is-success'
    });
  }

  private mounted() {
    // Set up the bus events
    EventBus.$on(EventList.PUSH_SNACKBAR, this.handlePushSnackBar);
  }
}
</script>
