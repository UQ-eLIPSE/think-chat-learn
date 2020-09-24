<template>
  <div class="pagination">
    <v-layout row class="controls align-center">

      <div class="squircular-icon uq start-btn" @click="firstPage()">
        <i class="icon-angle-double-left"></i>
      </div>

      <div class="squircular-icon uq previous-btn" @click="previousPage()">
        <i class="icon-chevron-left"></i>
      </div>

      <template v-for="(p, i) in pageArray">
        <div @click="changePageAction(p)" :key="`${i}-page`" :class="`pagination-number-${p}`">
          <PageNumber :numeral="p" 
                      :marked="isGroupMarking && groupList && p <= groupList.length ? groupList[p-1].marked : false" 
                      :selected="p === currentPage"/>
        </div>
      </template>

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
   * Usage: <Pagination :currentPage="currentPage" :totalPages="11" :numPageButtons="5" @pageChanged="changePage"/>
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

  export default class Pagination extends Vue {
    @Prop ({required: true, default: 1}) private currentPage!: number;
    @Prop ({required: true, default: 1}) private totalPages!: number;
    @Prop ({required: true, default: 0}) private numPageButtons!: number;

    /**Props for group marking, which will display check icon on marked group*/
    @Prop ({required: false, default: false}) private isGroupMarking!: boolean;
    @Prop ({required: false, default: () => []}) private groupList!: IPageNumber[];

    calculatePageArray(currentPage: number, totalPages: number, numVisiblePageButtons: number) {
      const pageArray = [];
      /* if (totalPages < numVisiblePageButtons) {
        numVisiblePageButtons = totalPages;
      } */

      //const startPage = Math.min(Math.max(currentPage - ~~(numVisiblePageButtons / 2), 1), totalPages - numVisiblePageButtons + 1);

      for (let i = 0; i < totalPages; i++) {
        pageArray.push(1 + i);
      }

      return pageArray;
    }

    get pageArray() {
      const pageArr = this.calculatePageArray(this.currentPage, this.totalPages, this.numPageButtons);
      return pageArr;
    }

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.$emit('pageChanged', this.currentPage + 1);
      }
    }

    previousPage() {
      if (this.currentPage > 1) {
        this.$emit('pageChanged', this.currentPage - 1);
      }
    }

    lastPage() {
      this.$emit('pageChanged', this.totalPages);
    }

    firstPage() {
      this.$emit('pageChanged', 1);
    }

    changePageAction(page: number) {
      this.$emit('pageChanged', page);
    }

  }
</script>

<style lang="scss" scoped>
@import "../../../css/partial/variables";
@import "../../../css/partial/fonts";
@import "../../../css/partial/icons";

.start-btn,
.end-btn{
  @include icon-wrapper-shape(33.3%, 22.5, 1.2);
}

.previous-btn,
.next-btn{
  @include icon-wrapper-shape(33.3%, 25, 1);
}

.start-btn,
.end-btn,
.previous-btn,
.next-btn{
  cursor: pointer;
}

.squircular-icon:not(:last-of-type){
  margin-right: 5px;
}

.pagination {
  height: 40px;
}
</style>