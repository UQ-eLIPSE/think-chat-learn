<template>
  <div class="container">
    <h2>Admin panel</h2>
    <span class="intro">Welcome to Think.Chat.Learn administration panel. You can mark quiz questions, setup/view quiz sessions and create/view questions</span>
  </div>
</template>

<style scoped>
.intro {
  font-size: 1em;
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
@Component({})
export default class Landing extends Vue {}
</script>