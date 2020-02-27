<template>
  <div>
    <transition name="slide">
      <Chat
        :chatMessages="chatMessages"
        v-if="toggleChat"
      />
    </transition>
    <header>
      <div class="nav-item logo"><a href="/client/#/"><span class="logo-bold">MOOC</span>chat</a></div>
      <div class="nav-item course-name">
        {{ `${user ? user.username : "No User"} - Session Id: ${quizSession ? quizSession._id : "N/A"}` }}
      </div>
      <div class="nav-item">
        <span class="toggleChat">
          <span class="title">Show chat</span>
          <b-switch v-model="toggleChat"></b-switch>
        </span>
        <span class="userAvatar">{{user ? `${user.firstName}` : "Please login via Blackboard"}}
        </span>
      </div>
    </header>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";
@import url("https://fonts.googleapis.com/css?family=Lato");

header {
  align-items: center;
  background-color: $white;
  display: flex;
  height: 75px;
  left: 0;
  padding: 1.5em 3em;
  position: relative;
  width: 100%;
  z-index: 2;

  .logo a {
    color: #225566 !important;
    font-family: "Lato", sans-serif;
    font-size: 1.25em !important;
    font-weight: 500 !important;

    .logo-bold {
      font-weight: 700 !important;
    }

    a {
      all: unset;
      cursor: pointer;
      &:hover {
        color: inherit;
      }
    }
  }

  .nav-item {
    font-size: 20px;
    font-weight: 600;

    .toggleChat {
      font-size: 14px;
      margin-right: 10px;

      .title {
        font-size: 14px;
        margin-right: 5px;
      }

      .switch {
        font-size: 12px;
        vertical-align: middle;
      }
    }

    .userAvatar {
      background-color: $mainBg;
      border: 1px solid #eff2f4;
      border-radius: 20px;
      color: $text;
      padding: 4px 12px;
    }

    a > svg.fa-comment {
      color: $tertiaryBg;
      margin-left: 15px;

      &:hover {
        color: $text;
      }
    }

    &.user-name {
      color: $primary;
    }
    &:first-child {
      margin-right: auto;
      height: 40px;
    }

    &:last-child {
      margin-left: auto;
    }
  }
  .slide-leave-active,
  .slide-enter-active {
    transition: 0.3s;
  }
  .slide-enter {
    transform: translate(100%, 0);
  }
  .slide-leave-to {
    transform: translate(100%, 0);
  }

  .notification {
    border: 1px solid red;
  }
}
</style>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { IUser, IQuizSession } from "../../../common/interfaces/DBSchema";
import Chat from "../components/Chat/Chat.vue";
import { TCLMessage } from "../interfaces";
import { EventBus } from "../EventBus";
import { EmitterEvents } from "../emitters";

@Component({
  components: {
    Chat
  }
})
export default class Nav extends Vue {
  get user(): IUser | null {
    return this.$store.getters.user;
  }

  get chatMessages(): TCLMessage[] {
    return this.$store.getters.chatMessages;
  }

  get quizSession(): IQuizSession | null {
    return this.$store.getters.quizSession;
  }

  private toggleChat: boolean = false;
  private newMessage: boolean | null = false;
  private groupFormed: boolean = false;

  // In short, if we have a message and the chat is off, notify new message
  @Watch("chatMessages")
  private handleMessageNotification(
    newVal: TCLMessage[],
    oldVal: TCLMessage[]
  ) {
    if (!this.toggleChat) {
      this.newMessage = true;
    }
  }

  public changeChatState() {
    this.toggleChat = !this.toggleChat;
    this.newMessage = false;
  }

  private mounted() {
    EventBus.$on(EmitterEvents.GROUP_FORMED, () => {
      this.toggleChat = true;
      this.newMessage = false;
      this.groupFormed = true;
    });
  }
}
</script>
