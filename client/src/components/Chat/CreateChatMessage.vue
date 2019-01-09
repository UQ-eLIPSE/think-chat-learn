<template>
  <div class="create-chat-message">
    <textarea
      type="text"
      placeholder="Share your ideas"
    />
    <button class="secondary">Send</button>
  </div>
</template>

<style lang="scss" scoped>
.create-chat-message {
  textarea {
    border: none;
    font-family: "Open Sans", sans-serif;
    font-size: 0.75em;
    height: 81px;
    margin: 0px;
    resize: none;
    width: 100%;

    &::placeholder {
      color: #b2b3b4;
    }

    &:focus {
      outline: 0;
    }
  }
  button.secondary {
    font-size: 0.8em;
  }
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import "../../styles.scss";

@Component({})
export default class CreateChatMessage extends Vue {}
</script>