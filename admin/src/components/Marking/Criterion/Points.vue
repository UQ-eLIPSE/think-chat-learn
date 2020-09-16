<template>
  <div class="points">
    <div
      class="point"
      @mouseenter="hoverPoint = point"
      @mouseleave="hoverPoint = null"
      @click="clickHandler(point)"
      :class="pointClasses(point)"
      v-for="point in totalPoints"
      :key="point"
    ></div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class Points extends Vue {

  @Prop({ required: true, default: () => 5 }) private totalPoints!: number;
  @Prop({ required: true, default: () => 0 }) private currentPoints!: number;
  
  private hoverPoint: number | undefined | null = null;

  pointClasses(point: number) {
    // Check if hovering
    if(this.hoverPoint) {
      return {
            colored: this.hoverPoint ? point <= this.hoverPoint : false,

      };
    } else if(this.currentPoints) {
      return {
        colored: point <= this.currentPoints
      }
    };
    
  }

  clickHandler(point: number) {
    console.log("Mark changed to :", point);
  }
}
</script>
<style lang="scss" scoped>
@import "../../../../css/partial/variables"; 

.points {
  display: flex;
  cursor: pointer;

  .point {
    margin: 0 0.1rem;
    border: 0.01em solid $yellow;
    height: 12px;
    width: 12px;
    border-radius: 50%;
    cursor: pointer;
    
    &.colored {
        background: $yellow;
        transition: background-color 200ms linear;
    }
  }
}
</style>