<template>
  <div :class="`squircular-icon ${selected? 'uq-solid selected': ''}`">
    <p>{{ numeral }}</p>
    <span v-if="marked" class="circular-icon marked green-cl"></span>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

export interface IPageNumber{
  page: number;
  marked?: boolean;    
}

@Component({})
export default class PageNumber extends Vue {
  @Prop({required: true}) private numeral!: number;
  @Prop({default: false}) private marked!: boolean;
  @Prop({default: false}) private selected!: boolean;
}

</script>

<style lang="scss" scoped>
@import "../../../css/partial/variables";
@import "../../../css/partial/fonts";

p {
  @include font-style(0.875em, auto, 500, $dark-grey);
  transform: translate(-50%, -50%);
  position: absolute;
  left: 50%;
  top: 50%;
}

.selected p{
  color: $white;
}

</style>