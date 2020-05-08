<template>
  <header class="header-wrapper">
    <a class="logo" href="/client/#/">
      <img src="@/assets/images/think-chat-learn-logo.svg" alt="Think.Chat.Learn" title="Think.Chat.Learn" />
    </a>
    <span class="userAvatar uq-static">
      <span class="icon-container">
        <font-awesome-icon icon="user" />
      </span>
      {{user ? `${user.username}` : "Please login via Blackboard"}}
    </span>
  </header>
</template>

<style lang="scss" scoped>
a.logo img {
  width: 300px;
}
.userAvatar {
  align-items: center;
  border-radius: 20px;
  color: $uq;
  display: flex;
  font-weight: 600;
  padding: 4px 12px;

  .icon-container {
    align-items: center;
    background: $uq;
    border-radius: 50%;
    display: flex;
    height: 20px;
    justify-content: center;
    margin-right: 0.5em;
    width: 20px;

    svg {
      color: $white;
      font-size: 0.7em;
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { IUser } from "../../../common/interfaces/DBSchema";
import Timer from "./Timer.vue";

@Component({
  components: {
    Timer
  }
})
export default class Header extends Vue {
  get user(): IUser | null {
    return this.$store.getters.user;
  }
}
</script>
