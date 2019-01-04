<template>
  <div class="content-container">
  </div>
</template>

<style lang="scss" scoped>
.content-container {
  background-color: white;
  border: 6px solid greenyellow;
  border-radius: 5px;
  box-shadow: 0px 3px 6px;
  padding: 2em;
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({})
export default class ContentContainer extends Vue {}
</script>

