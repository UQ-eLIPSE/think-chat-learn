<template>
  <div class="collapsible">
    <div class="collapsible-header flex-row justify-space-between" @click="toggle()" :style="collapsibleHeaderStyles">
        <h4>{{ title }}</h4>
        <div class="flex-row">
            <span class="label" v-if="label">{{ label }}</span>
            <font-awesome-icon  :icon="open? 'chevron-up' : 'chevron-down'" />
        </div>
    </div>

    <div class="collapsible-body" v-show="open" :style="collapsibleStyles">
        <slot>

        </slot>
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";

@Component
export default class Collapsible extends Vue {
  @Prop({ default: "", required: false }) title!: string;
  @Prop({ default: "", required: false }) label!: string;
  @Prop({ default: "white", required: false }) backgroundColor!: string;
  @Prop({ default: "rgba(1, 0, 0, 0.05)", required: false }) headerBackgroundColor!: string;

  private open = false;

  get collapsibleStyles() {
      return {
          background: this.backgroundColor
      };
  }


  get collapsibleHeaderStyles() {
      return {
          background: this.headerBackgroundColor
      };
  }

  toggle() {
      this.open = !this.open;
  }
}
</script>

<style lang="scss" scoped>
.collapsible {
    cursor: pointer;
    border-top: 0.01em double rgba(1,0,0,0.1);
    border-left: 0.01em double rgba(1,0,0,0.1);
    border-right: 0.01em double rgba(1,0,0,0.1);

    .collapsible-header {
        padding: 0.8rem;

        &:hover {
            opacity: 0.8;
        }
    }

    .collapsible-body {
        padding: 0.8rem;
    }

    h4 {
        color: black;
    }


}

.flex-row {
    display: flex;
}

.justify-space-between {
    justify-content: space-between;
}

.label {
    font-size: 0.7em;
    font-weight: bold;
    text-transform: uppercase;
    padding-right: 0.5rem;
}
</style>