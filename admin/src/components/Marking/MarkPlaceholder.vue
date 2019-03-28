<template>
  <router-view />
</template>



<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class MarkPlaceholder extends Vue {
}
</script>
<style lang="scss" scoped>
@import "../../../css/variables.scss";

</style>