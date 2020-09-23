<template>
  <div class="container">
    <h2>Admin panel</h2>
    <span class="intro">Welcome to Think.Chat.Learn administration panel. You can mark quiz questions, setup/view quiz sessions and create/view questions</span>
    <AutoComplete :itemList="generatedList" :value="currentValue" @click="onClick"/>
  </div>
</template>

<style scoped>
.intro {
  font-size: 1em;
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import AutoComplete from "../elements/AutoComplete.vue";

@Component({
  components: {
    AutoComplete
  }
})
export default class Landing extends Vue {
  private currentValue = "value from parent";
  get generatedList() {
    return [
      {
        label: "Item1",
        value: "item-1"
      },
      {
        label: "Item2",
        value: "item-2"
      },
      {
        label: "Item3",
        value: "item-3"
      }
    ]
  }

  onClick(index: number){
    const list = this.generatedList;
    this.currentValue = "value from parent";
  }
}
</script>