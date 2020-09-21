<template>
  <div :class="`squircular-icon ${selected? 'uq-solid selected': ''}`">
    <p>{{ numeral }}</p>
    <span v-if="marked" class="marked">
      <div :class="`circular-icon  ${selected? 'green-cl-solid': 'green-cl-static'}`">
        <i class="icon-check"/>
      </div>
    </span>
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
@import "../../../css/partial/icons";

.squircular-icon{
  cursor: pointer;
}

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

.marked{
  position: absolute;
  right: 2px;
  top: 2px;
  .circular-icon{
    @include icon-wrapper-shape(50%, 11, 0.6);
  }
}

</style>