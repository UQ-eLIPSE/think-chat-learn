<template>
  <div class="collapsible">
    <div
      class="collapsible-header flex-row justify-space-between"
      @click="toggle()"
      :style="collapsibleHeaderStyles"
    >
      <h4>{{ title }}</h4>
      <div class="flex-row">
        <span class="label" v-if="label">{{ label }}</span>
        <i :class="open? 'icon-chevron-up' : 'icon-chevron-down'"/>
      </div>
    </div>

    <div class="collapsible-body" v-show="open" :style="collapsibleStyles">
      <slot></slot>
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
  @Prop({ default: "#fff", required: false }) headerBackgroundColor!: string;

  private open = false;

  get collapsibleStyles() {
    return {
      background: this.backgroundColor,
    };
  }

  get collapsibleHeaderStyles() {
    return {
      background: this.headerBackgroundColor,
    };
  }

  toggle() {
    this.open = !this.open;
  }
}
</script>

<style lang="scss" scoped>
@import "../../css/partial/variables.scss";
.collapsible {
  .collapsible-header {
    border-top: 0.01em double rgba(1, 0, 0, 0.1);
    border-left: 0.01em double rgba(1, 0, 0, 0.1);
    border-right: 0.01em double rgba(1, 0, 0, 0.1);
    border-radius: 5px;

    padding: 0.8rem;
    cursor: pointer;
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
  font-size: 0.6em;
  text-transform: uppercase;
  padding-right: 0.5rem;
  color: $grey;
}
</style>