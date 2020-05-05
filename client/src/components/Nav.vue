<template>
  <header class="header-wrapper flex-row align-center">
    <a class="logo" href="/client/#/">
      <img src="@/assets/images/think-chat-learn-logo.svg" alt="Think.Chat.Learn" title="Think.Chat.Learn" />
    </a>
  </header>
</template>

<style lang="scss" scoped>
a.logo img {
  width: 300px;
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import Timer from "./Timer.vue";

@Component({
  components: {
    Timer
  }
})
export default class Header extends Vue {}
</script>
