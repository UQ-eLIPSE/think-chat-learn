<template>
  <header>
    <img
      class="nav-item moochat-logo"
      alt="MOOCchat"
      src="../../public/moocchat-logo.svg"
      title="MOOCchat"
    >
    <div class="nav-item course-name">{{user ? user.username : "No User" }}</div>
    <div class="nav-item">
      <span>{{user ? `Welcome, ${user.firstName}` : "Please login via Blackboard" }}</span>
      <!-- <span><button
          @click="toggleChat = !toggleChat"
          style="color: black"
        >SHOW CHAT!</button>
        <transition name="slide">
          <Chat v-if="toggleChat" />
        </transition>
      </span> -->
      <span>
        <!-- <i
          class="fas fa-comment"
          @click="toggleChat = !toggleChat"
          style="color: black; width: 35px;"
        /> -->
        <div class="block">
          <b-icon
            pack="fas"
            icon="user"
            size="is-small"
          >
          </b-icon>
        </div>
        <transition name="slide">
          <Chat v-if="toggleChat" />
        </transition>
      </span>
    </div>

    <!-- Add v-for later-->
    <!-- <ul>
            <router-link tag="li" to="/">Welcome</router-link>
            <router-link tag="li" to="/initial-answer">Intial Answer</router-link>
            <router-link tag="li" to="/discussion">Discussion</router-link>
            <router-link tag="li" to="/reflection">Reflection</router-link>
            <router-link tag="li" to="/survey">Survey</router-link>
            <router-link tag="li" to="/finish">Finish</router-link>
        </ul> -->
  </header>
</template>

<style lang="scss" scoped>
header {
  align-items: center;
  background-color: white;
  display: flex;
  height: 75px;
  left: 0;
  padding: 1.5em 3em;
  width: 100%;

  .nav-item {
    font-size: 20px;
    font-weight: 600;
    &.user-name {
      color: #005151;
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
}

.moochat-name {
  line-height: 1;
  margin: 2rem 2rem 1rem;
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { IUser } from "../../../common/interfaces/DBSchema";
import Chat from "../components/Chat/Chat.vue";

@Component({
  components: {
    Chat
  }
})
export default class Nav extends Vue {
  get user(): IUser | null {
    return this.$store.getters.user;
  }

  private toggleChat: true | null = null;
}
</script>
