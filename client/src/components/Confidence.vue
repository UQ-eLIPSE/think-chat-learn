<template>
  <div class="confidence">
    <div class="block">
      <h3>Confidence:</h3>
      <b-radio
        v-model="confidence"
        :native-value="1"
        :disabled="disabled"
      > 1 </b-radio>
      <b-radio
        v-model="confidence"
        :native-value="2"
        :disabled="disabled"
      > 2 </b-radio>
      <b-radio
        v-model="confidence"
        :native-value="3"
        :disabled="disabled"
      > 3 </b-radio>
      <b-radio
        v-model="confidence"
        :native-value="4"
        :disabled="disabled"
      > 4 </b-radio>
      <b-radio
        v-model="confidence"
        :native-value="5"
        :disabled="disabled"
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
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import { EmitterEvents } from "../emitters";
import { Response } from "../../../common/interfaces/ToClientData";

@Component({})
export default class Confidence extends Vue {
  @Prop({ default: null }) private currentResponse!: Response | null;

  private confidence: number | undefined = 1;

  get disabled(): boolean {
    return this.currentResponse ? true : false;
  }

  @Watch("confidence")
  private onConfidenceChange(value: number, oldValue: number) {
    this.$emit(EmitterEvents.CONFIDENCE_CHANGE, value);
  }
}
</script>
