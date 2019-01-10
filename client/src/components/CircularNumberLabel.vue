<template>
  <label :class="`base${+numeral}`"> {{ numeral }} </label>
</template>

<style lang="scss" scoped>
label {
  border-radius: 50%;
  color: #fff;
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

  &.base1 {
    background-color: #6dc7b7;
    border: 3px solid #60afa1;
  }
  &.base2 {
    background-color: #99b204;
    border: 3px solid #869b03;
  }
  &.base3 {
    background-color: #ffae00;
    border: 3px solid #e8a004;
  }
  &.base4 {
    background-color: #ff7659;
    border: 3px solid #e26a51;
  }
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component({})
export default class CircularNumberLabel extends Vue {
  @Prop({}) private numeral!: number;
}
</script>
