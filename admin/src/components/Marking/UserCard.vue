<template>
  <div :class="`card-container user-card ${selected? `selected base-cl-${numeral} border-cl transparent-cl`:''}`">
    <v-layout row wrap class="align-center">
        <CircularNumberLabel :numeral="numeral" />
        <p>{{studentId}}</p>
        <div v-if="marked" class="circular-icon green-cl-static">
            <i class="icon-check"></i>
        </div>
    </v-layout>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import CircularNumberLabel from "./CircularNumberLabel.vue";

/*Example <UserCard :studentId="s2345678" :numeral="2" :marked="true" :selected="true"/> */

@Component({
  components: {
    CircularNumberLabel
  }
})

export default class UserCard extends Vue {
  @Prop({required: true}) private studentId!: string;
  @Prop({}) private numeral!: number;
  @Prop({required: true, default: false}) private marked!: boolean;
  @Prop({required: true, default: false}) private selected!: boolean;
}

</script>

<style lang="scss" scoped>
@import "../../../css/partial/variables";
@import "../../../css/partial/fonts";
@import "../../../css/partial/icons";

.user-card.card-container {
  @include font-style(0.875em, auto, 400, $darker-grey);
  width: fit-content;
  padding: 12px 16px;
  height: fit-content;

  label {
      @include font-style(1.5, auto, 500, $white);

      border-radius: 10px;
      border: 0;

      width: 30px;
      height: 30px;
      margin: 0 0.5em 0 0;

      position: relative;
  }

  p {
      margin: 0 0.5em 0 0;
  }

  &.selected{
    border-width: 2px;
  }
}

.circular-icon > i{
  font-size: 1.2em;
}
</style>