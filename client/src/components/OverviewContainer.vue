<template>
  <div
    class="overviewContainer"
    style="position: relative;"
  >
    <div class="overview">
      <h2>{{ title }}</h2>
      <slot />
    </div>
    <CircularNumberLabel :numeral="numeral" />
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

.overviewContainer {
  margin-right: 2em;
  @media (max-width: 850px) {
    margin-right: 0em;
  }

  .overview {
    background: #f9fbfc;
    border: 1px solid #eff2f4;
    border-radius: 5px;
    max-width: 635px;
    margin-left: 25px;
    margin-top: 45px;
    min-height: 13.45em;
    padding: 0.75em 2em 2em 3.25em;

    &:nth-child(2n + 3) {
      margin-left: 45px;
    }

    h2 {
      color: $primary;
      font-size: 1.75em;
      font-weight: 600;
    }

    ul {
      li {
        color: #515456;
        font-size: 19px;
      }
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import CircularNumberLabel from "../components/CircularNumberLabel.vue";

@Component({
  components: {
    CircularNumberLabel
  }
})
export default class OverviewContainer extends Vue {
  @Prop({}) private title!: string;
  @Prop({}) private numeral!: number;
}
</script>
