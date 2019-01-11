<template>
  <div class="confidence">
    <div class="block">
      <h3>Confidence:</h3>
      <b-radio
        v-model="confidence"
        :native-value="1"
      > 1 </b-radio>
      <b-radio
        v-model="confidence"
        :native-value="2"
      > 2 </b-radio>
      <b-radio
        v-model="confidence"
        :native-value="3"
      > 3 </b-radio>
      <b-radio
        v-model="confidence"
        :native-value="4"
      > 4 </b-radio>
      <b-radio
        v-model="confidence"
        :native-value="5"
      > 5 </b-radio>
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
import { Vue, Component, Watch } from "vue-property-decorator";
import { EmitterEvents } from "../emitters";

@Component({})
export default class Confidence extends Vue {
  private confidence: number | undefined = 1;

  @Watch("confidence")
  onConfidenceChange(_value: number, _oldValue: number) {
    this.$emit(EmitterEvents.CONFIDENCE_CHANGE, _value);
  }
}
</script>
