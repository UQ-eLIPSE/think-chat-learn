<template>
  <div>
    <transition name="slide">
      <Chat
        :chatMessages="chatMessages"
        v-if="toggleChat"
      />
    </transition>
    <header>
      <div class="nav-item logo">
        <a href="/client/#/">
          <img src="@/assets/images/think-chat-learn-logo.svg" alt="Think.Chat.Learn" title="Think.Chat.Learn" />
        </a>
      </div>
      <div class="nav-item course-name">
        {{ `${user ? user.username : "No User"} - Session Id: ${quizSession ? quizSession._id : "N/A"}` }}
      </div>
      <div class="nav-item">
        <span class="toggleChat">
          <font-awesome-icon icon="comment-dots" />
          <span class="title"> Show/Hide Chat</span>
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

  .nav-item {
    font-size: 20px;
    font-weight: 600;

    &.logo a img {
      width: 300px;
    }

    .toggleChat {
      font-size: 14px;
      margin-right: 10px;

      .title {
        font-size: 20px;
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
import { IUser, IQuizSession, IQuiz, Page } from "../../../common/interfaces/DBSchema";
import Chat from "../components/Chat/Chat.vue";
import { Message } from "../interfaces";
import { EventBus } from "../EventBus";
import { EmitterEvents } from "../emitters";
import { PageType } from "../../../common/enums/DBEnums";

@Component({
  components: {
    Chat
  }
})
export default class Nav extends Vue {
  get user(): IUser | null {
    return this.$store.getters.user;
  }

  get chatMessages(): Message[] {
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
    newVal: Message[],
    oldVal: Message[]
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

  get quiz(): IQuiz | null {
    const quiz = this.$store.getters.quiz;

    if (!quiz) {
      return null;
    }

    return quiz;
  }

  // The idea is based on the quiz and current page,
  // render it appropiately
  get currentIndex(): number {
    return this.$store.getters.currentIndex;
  }


  // If we get an out of bound for the pages, set to null
  get page(): Page | null {
    if (
      this.quiz &&
      this.quiz.pages &&
      this.currentIndex < this.quiz.pages.length
    ) {
      return this.quiz.pages[this.currentIndex];
    } else {
      return null;
    }
  }

  get socketState() {
    return this.$store.getters.socketState;
  }

/**
 * Changes visibility of chat window  based on
 * page type and chatGroupFormed status
 */
  @Watch("currentIndex")
  private currentIndexChangeHandler(newVal: boolean, oldVal?: boolean) {
    // this.toggleChat -> true, if
    //  - chat group exists
    //  - current page is discussion page
    //  - (Note that this automatically handles the session re-join condition)
    
    // this.toggleChat -> false, if
    //  - current page is not discussion page
    //    - (since users complained of chat window covering content)
    
    // Note: Frequent opening/closing of chat window would (hopefully)
    // signal to users that the chat window can be shown/hidden
    if (this.page && this.page.type !== PageType.DISCUSSION_PAGE) {
      this.toggleChat = false;
    }
    
    if (this.page && this.page.type === PageType.DISCUSSION_PAGE &&
      this.socketState && this.socketState.chatGroupFormed &&
      this.socketState.chatGroupFormed.groupId) {
        this.toggleChat = true;
    }
  }
}
</script>
