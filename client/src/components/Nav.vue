<template>
  <header>
    <div class="nav-item logo"><span class="logo-bold">MOOC</span>chat</div>
    <div class="nav-item course-name">
      {{ user ? user.username : "No User" }}
    </div>
    <div class="nav-item">
      <span>{{
        user ? `Welcome, ${user.firstName}` : "Please login via Blackboard"
        }}
      </span>
      <span>
        <a @click="changeChatState()">
          <font-awesome-icon :style="{ color: !newMessage || !groupFormed ? 'grey' : 'red' }" icon="comment-dots" />
        </a>
        <transition name="slide">
          <Chat :chatMessages="chatMessages" v-if="toggleChat" />
        </transition>
      </span>
    </div>
  </header>
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
  width: 100%;

  .logo {
    color: #225566;
    font-family: "Lato", sans-serif;
    font-size: 1.825em !important;
    font-weight: 500 !important;

    .logo-bold {
      font-weight: 700 !important;
    }
  }

  .nav-item {
    font-size: 20px;
    font-weight: 600;

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
import { IUser } from "../../../common/interfaces/DBSchema";
import Chat from "../components/Chat/Chat.vue";
import { MoocChatMessage } from "../interfaces";
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

  get chatMessages(): MoocChatMessage[] {
    return this.$store.getters.chatMessages;
  }

  private toggleChat: boolean = false;
  private newMessage: boolean | null = false;
  private groupFormed: boolean = false;

  // In short, if we have a message and the chat is off, notify new message
  @Watch("chatMessages")
  private handleMessageNotification(newVal: MoocChatMessage[], oldVal: MoocChatMessage[]) {
    if (!this.toggleChat) {
      this.newMessage = true;
    }
  }

  private changeChatState() {
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
