<template>
  <div class="create-chat-message">
    <input type="text">
    <button class="secondary">Send</button>
  </div>
</template>

<style lang="scss" scoped>
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import "../styles.scss";

@Component({})
export default class CreateChatMessage extends Vue {}
</script>