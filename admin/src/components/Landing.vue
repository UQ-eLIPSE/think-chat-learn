<template>
  <div class="container">
    <h2>Admin panel</h2>
    <span class="intro">Welcome to MOOCchat admin panel. You can mark quiz questions, setup/view quiz sessions (coming soon) and create/view questions(coming soon)</span>
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