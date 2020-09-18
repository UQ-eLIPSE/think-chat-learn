<template>
  <div class="pagination">
    <div class="controls">
      
    </div>
  </div>
</template>

<script lang="ts">
  import { Vue, Component, Prop } from "vue-property-decorator";
  export class Pagination extends Vue {
    @Prop ({required: true, default: 1}) private currentPage!: number;
    @Prop ({required: true, default: 1}) private totalPages!: number;
    @Prop ({required: true, default: 0}) private numPageButtons!: number;
    @Prop ({required: true, default: () => {}}) private changePageAction!: Function;
  }
</script>