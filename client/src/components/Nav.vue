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
        <a
          @click="toggleChat = !toggleChat"
          style="color: black"
        >
          <font-awesome-icon icon="comment" />
        </a>
        <transition name="slide">
          <Chat v-if="toggleChat" />
        </transition>
      </span>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css?family=Lato");

header {
  align-items: center;
  background-color: white;
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
