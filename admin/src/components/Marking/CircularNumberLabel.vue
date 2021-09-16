<template>
  <label :class="`base-cl-${numeral} border-cl`"> {{ numeral }} </label>
  
</template>

<style lang="scss" scoped>
@import "../../../css/partial/variables";

label {
  border-radius: 50%;
  color: $white;
  display: inline-block;
  font-size: 2.2em;
  font-weight: 700;
  height: 60px;
  left: 0;
  margin-top: 45px;
  position: absolute;
  text-align: center;
  text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.15);
  top: 0;
  width: 60px;
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component({})
export default class CircularNumberLabel extends Vue {
  @Prop({}) private numeral!: number;
}
</script>
