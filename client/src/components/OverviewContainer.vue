<template>
  <div
    class="overviewContainer"
    style="position: relative;"
  >
    <div class="overview">
      <h2>{{title}}</h2>
      <slot />
    </div>
    <label :class="color">
      {{number}}
    </label>
  </div>
</template>

<style lang="scss" scoped>
.overviewContainer {
  label {
    border-radius: 50%;
    color: #fff;
    display: inline-block;
    font-size: 2.2em;
    font-weight: 700;
    height: 60px;
    left: 0;
    position: absolute;
    text-align: center;
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
  .overview {
    background: #f9fbfc;
    border: 1px solid #eff2f4;
    border-radius: 5px;
    float: left;
    height: 215px;
    margin-left: 25px;
    margin-bottom: 50px;
    padding: 0.75em 2em 2em 3.25em;
    position: relative;
    width: 675px;

    &:nth-child(2n + 3) {
      margin-left: 45px;
    }

    h2 {
      color: #005151;
      font-size: 1.75em;
      font-weight: 600;
    }

    ul {
      li {
        color: #515456;
        font-size: 19px;
      }
      li::before {
        content: "•";
        color: #869b03;
        height: 20px;
        width: 20px;
      }
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
@Component
export default class OverviewContainer extends Vue {
  @Prop({}) private title!: string;
  @Prop({}) private number!: number;
  @Prop({}) private color!: string;
}
</script>

