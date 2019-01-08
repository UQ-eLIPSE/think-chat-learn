<template>
  <div class="confidence">
    <div class="block">
      <h3>Confidence:</h3>
      <b-radio
        v-model="confidence"
        native-value="one"
      >
        1
      </b-radio>
      <b-radio
        v-model="confidence"
        native-value="two"
      >
        2
      </b-radio>
      <b-radio
        v-model="confidence"
        native-value="three"
      >
        3
      </b-radio>
      <b-radio
        v-model="confidence"
        native-value="four"
      >
        4
      </b-radio>
      <b-radio
        v-model="confidence"
        native-value="five"
      >
        5
      </b-radio>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.confidence {
  margin-bottom: 1em;
  h3 {
    display: inline-block;
    margin-right: 1em;
  }
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import "../styles.scss";

@Component({})
export default class Confidence extends Vue {
  private confidence: string | undefined = "";
}
</script>