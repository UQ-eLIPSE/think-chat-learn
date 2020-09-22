<template>
  <v-app>
    <v-navigation-drawer permanent app class="z-index-zero">
      <v-toolbar flat color="uq" class="py-2">
        <span class="text-truncate title">Course: {{course}}</span>
      </v-toolbar>
      <v-list class="pt-2">
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
    <v-dialog v-model="openDialog">
      <v-card>
        <v-card-title
          class="headline"
          primary-title
        >
          {{loadedDialogEvent.title}}
        </v-card-title>

        <v-card-text>
          {{loadedDialogEvent.message}}
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            flat
            @click="openDialog = false"
          >
            No
          </v-btn>
          <!-- Hacky way to take in a function with variable lengths -->
          <v-btn
            color="primary"
            flat
            @click="(() => { openDialog= false; handledLoadedFunction();}) "
          >
            Yes
          </v-btn>
        </v-card-actions>
      </v-card>      
    </v-dialog>
  </v-app>
</template>

<style lang="scss">
@import "../css/app.scss";

</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Snackbar } from 'buefy/dist/components/snackbar'
import { EventBus, EventList, SnackEvent, ModalEvent } from "./EventBus";

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

@Component
export default class App extends Vue {

  private openDialog: boolean = false;
  private loadedDialogEvent: ModalEvent = {
    message: "",
    title: ""
  }

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

  private handleOpenModal(data: ModalEvent) {
    this.openDialog = true;
    this.loadedDialogEvent = data;
  }

  private handledLoadedFunction() {
    if (this.loadedDialogEvent.fn && this.loadedDialogEvent.data) {
      // Remember, apply takes in an array of data and fills out the function signature
      this.loadedDialogEvent.fn.apply(this.loadedDialogEvent.selfRef ? this.loadedDialogEvent.selfRef : null, this.loadedDialogEvent.data);
    }
  }

  private mounted() {
    // Set up the bus events
    EventBus.$on(EventList.PUSH_SNACKBAR, this.handlePushSnackBar);
    EventBus.$on(EventList.OPEN_MODAL, this.handleOpenModal);
  }
}
</script>
