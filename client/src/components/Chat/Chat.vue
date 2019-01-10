<template>
  <div class="chat">
    <!-- <div v-bind="messages" v-for="message in messages"> -->
    <div class="message-container">
      <ChatAlert
        alertType="standard"
        alertMessage="You are the only cat in this alley"
      />
      <ChatAlert
        alertType="warning"
        alertMessage="Your group has 4 members"
      />

      <ChatMessage
        color="base1"
        numeral=" 3"
        content="THis is so cool"
      />
      <ChatMessage
        numeral="1"
        content="I'm having fun"
      />
      <ChatMessage
        numeral="4"
        content="Woohoo"
      />
      <ChatMessage
        numeral="2"
        content="How great is this?"
      />
      <ChatMessage
        numeral="1"
        content="Cake pudding brownie ice cream croissant gingerbread biscuit. Cake marshmallow carrot cake carrot cake chocolate cake dessert lollipop carrot cake gummies. Toffee bonbon jujubes halvah halvah carrot cake pie. Jelly-o apple pie jelly-o croissant biscuit. Topping icing chocolate bar candy sesame snaps danish. Tootsie roll chocolate cake pudding pie bear claw. Gummies muffin dessert carrot cake chocolate bar sweet roll bear claw. Croissant tart marzipan powder tart chocolate cake topping. Toffee macaroon liquorice icing topping dragée gummi bears croissant cookie. Candy muffin chocolate bar gummies jujubes donut caramels jujubes."
      />
      <ChatMessage
        numeral="1"
        content="Cake pudding brownie ice cream croissant gingerbread biscuit. Cake marshmallow carrot cake carrot cake chocolate cake dessert lollipop carrot cake gummies. Toffee bonbon jujubes halvah halvah carrot cake pie. Jelly-o apple pie jelly-o croissant biscuit. Topping icing chocolate bar candy sesame snaps danish. Tootsie roll chocolate cake pudding pie bear claw. Gummies muffin dessert carrot cake chocolate bar sweet roll bear claw. Croissant tart marzipan powder tart chocolate cake topping. Toffee macaroon liquorice icing topping dragée gummi bears croissant cookie. Candy muffin chocolate bar gummies jujubes donut caramels jujubes."
      />
      <ChatMessage
        numeral="1"
        content="Cake pudding brownie ice cream croissant gingerbread biscuit. Cake marshmallow carrot cake carrot cake chocolate cake dessert lollipop carrot cake gummies. Toffee bonbon jujubes halvah halvah carrot cake pie. Jelly-o apple pie jelly-o croissant biscuit. Topping icing chocolate bar candy sesame snaps danish. Tootsie roll chocolate cake pudding pie bear claw. Gummies muffin dessert carrot cake chocolate bar sweet roll bear claw. Croissant tart marzipan powder tart chocolate cake topping. Toffee macaroon liquorice icing topping dragée gummi bears croissant cookie. Candy muffin chocolate bar gummies jujubes donut caramels jujubes."
      />
      <ChatMessage
        numeral="1"
        content="Cake pudding brownie ice cream croissant gingerbread biscuit. Cake marshmallow carrot cake carrot cake chocolate cake dessert lollipop carrot cake gummies. Toffee bonbon jujubes halvah halvah carrot cake pie. Jelly-o apple pie jelly-o croissant biscuit. Topping icing chocolate bar candy sesame snaps danish. Tootsie roll chocolate cake pudding pie bear claw. Gummies muffin dessert carrot cake chocolate bar sweet roll bear claw. Croissant tart marzipan powder tart chocolate cake topping. Toffee macaroon liquorice icing topping dragée gummi bears croissant cookie. Candy muffin chocolate bar gummies jujubes donut caramels jujubes."
      />
      <ChatMessage
        numeral="1"
        content="Cake pudding brownie ice cream croissant gingerbread biscuit. Cake marshmallow carrot cake carrot cake chocolate cake dessert lollipop carrot cake gummies. Toffee bonbon jujubes halvah halvah carrot cake pie. Jelly-o apple pie jelly-o croissant biscuit. Topping icing chocolate bar candy sesame snaps danish. Tootsie roll chocolate cake pudding pie bear claw. Gummies muffin dessert carrot cake chocolate bar sweet roll bear claw. Croissant tart marzipan powder tart chocolate cake topping. Toffee macaroon liquorice icing topping dragée gummi bears croissant cookie. Candy muffin chocolate bar gummies jujubes donut caramels jujubes."
      />
    </div>

    <div class="input-container">
      <CreateChatMessage />
    </div>
    <!-- </div> -->
  </div>
</template>

<style lang="scss" scoped>
.chat {
  background-color: #f7f8f8;
  height: 86%;
  position: absolute;
  right: 0;
  top: 75px;
  width: 400px;
  z-index: 1;

  .message-container {
    height: 86%;
    overflow: scroll;
    padding: 15px;
  }

  .input-container {
    background-color: #fff;
    height: 14%;
    position: absolute;
    bottom: 0;
    width: 100%;
    padding: 15px;
  }
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import ChatAlert from "./ChatAlert.vue";
import ChatMessage from "./ChatMessage.vue";
import CreateChatMessage from "./CreateChatMessage.vue";

@Component({
  components: {
    ChatAlert,
    ChatMessage,
    CreateChatMessage
  }
})
export default class Chat extends Vue {}
</script>
