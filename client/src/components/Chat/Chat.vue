<template>
  <div class="chat">
    <!-- <div v-bind="messages" v-for="message in messages"> -->
    <ChatMessage
      userNumber="three"
      content="THis is so cool"
    />
    <ChatMessage
      userNumber="one"
      content="I'm having fun"
    />
    <ChatMessage
      userNumber="four"
      content="Woohoo"
    />
    <ChatMessage
      userNumber="two"
      content="How great is this?"
    />
    <ChatMessage
      userNumber="one"
      content="My life is fantasic!"
    />
    <CreateChatMessage />
    <!-- </div> -->
  </div>
</template>

<style lang="scss" scoped>
.chat {
  background-color: #f7f8f8;
  height: 86%;
  padding: 15px;
  position: absolute;
  right: 0;
  top: 75px;
  width: 400px;
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import "../styles.scss";
import ChatMessage from "./ChatMessage.vue";
import CreateChatMessage from "./CreateChatMessage.vue";

@Component({
  components: {
    ChatMessage,
    CreateChatMessage
  }
})
export default class Chat extends Vue {}
</script>