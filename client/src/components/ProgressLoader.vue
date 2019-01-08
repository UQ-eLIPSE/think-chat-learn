<template>
  <div class="progress-loader">
    {{percentLoaded}}%
    <div class="loader-container">
      <div
        class="loader-bar"
        :style="style"
      ></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.progress-loader {
  color: #fead00;
  font-size: 12em;
  font-weight: 600;
  line-height: 1;
  margin: 0 auto 0.25em auto;
  width: 365px;
  .loader-container {
    border-radius: 20px;
    box-shadow: inset 0 0 0 2px rgba(165, 165, 165, 0.5), inset 0 0 0 10px #fff;
    height: 35px;
    margin: 0 auto;
    padding: 10px;
    .loader-bar {
      content: " ";
      background: linear-gradient(to right, #fead00 0%, #ff7659 100%);
      border-radius: 20px;
      height: 15px;
      width: 26%;
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import "../styles.scss";

@Component({})
export default class ProgressLoader extends Vue {
  @Prop({}) private percentLoaded!: number;
  // style() {
  //   return "width: " + `${this.percentLoaded}%`;
  // }
}
</script>