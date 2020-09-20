<template>
  <div class="pagination">
    <v-layout row class="controls align-center">

      <div class="squircular-icon uq start-btn" @click="firstPage()">
        <i class="icon-angle-double-left"></i>
      </div>

      <div class="squircular-icon uq previous-btn" @click="previousPage()">
        <i class="icon-chevron-left"></i>
      </div>

      <div v-for="p in pageArray" :key="p">
        <div @click="changePageAction(p)">
          <PageNumber :numeral="p" :marked="false" :selected="p === currentPage"/>
        </div>
      </div>
      <div class="squircular-icon uq next-btn" @click="nextPage()">
        <i class="icon-chevron-right"></i>
      </div>

      <div class="squircular-icon uq end-btn" @click="lastPage()">
        <i class="icon-angle-double-right"></i>
      </div>

    </v-layout>
  </div>
</template>

<script lang="ts">
  import { Vue, Component, Prop } from "vue-property-decorator";
  import PageNumber, {IPageNumber} from "./PageNumber.vue";

  /**---------------------------------
   * Usage: <Pagination :currentPage="currentPage" :totalPages="5" :numPageButtons="11" :changePageAction="changePage"/>
   * <script lang="ts">
   * class Example {
   *  ...
   *  private currentPage = 1;
   *  changePage(newPage: number){
   *      this.currentPage = newPage;
   *  }
   *  ...
   * }
   * ---------------------------------
   */
  @Component ({
    components: {
      PageNumber
    }
  })

  //Migrated pagination component from International Admin
  /** @TODO Replace current number type to IPageNumber when marked props can be populated*/

  export default class Pagination extends Vue {
    @Prop ({required: true, default: 1}) private currentPage!: number;
    @Prop ({required: true, default: 1}) private totalPages!: number;
    @Prop ({required: true, default: 0}) private numPageButtons!: number;
    @Prop ({required: true, default: (p: number) => {}}) private changePageAction!: (p: number) => void;

    calculatePageArray(currentPage: number, totalPages: number, numPagedivnks: number) {
      const pageArray = [];
      if (totalPages < numPagedivnks) {
        numPagedivnks = totalPages;
      }

      const startPage = Math.min(Math.max(currentPage - ~~(numPagedivnks / 2), 1), totalPages - numPagedivnks + 1);

      for (let i = 0; i < numPagedivnks; i++) {
        pageArray.push(startPage + i);
      }

      return pageArray;
    }

    get pageArray() {
      const pageArr = this.calculatePageArray(this.currentPage, this.totalPages, this.numPageButtons);
      return pageArr;
    }

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.changePageAction(this.currentPage + 1);
      }
    }

    previousPage() {
      if (this.currentPage > 1) {
        this.changePageAction(this.currentPage - 1);
      }
    }

    lastPage() {
      this.changePageAction(this.totalPages);
    }

    firstPage() {
      this.changePageAction(1);
    }

  }
</script>

<style lang="scss" scoped>
@import "../../../css/partial/variables";
@import "../../../css/partial/fonts";
@import "../../../css/partial/icons";

.start-btn,
.end-btn{
  @include icon-wrapper-shape(33.3%, 25, 1.3);
}

.squircular-icon:not(:last-of-type){
  margin-right: 5px;
}
</style>