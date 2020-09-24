<template>
  <div class="pagination">
    <v-layout row class="controls align-center">

      <div :class="`squircular-icon start-btn ${currentPage === 1 ? 'disabled-button-cs': 'uq'}`" @click="firstPage()">
        <i class="icon-angle-double-left"></i>
      </div>

      <div :class="`squircular-icon previous-btn ${currentPage === 1 ? 'disabled-button-cs': 'uq'}`" @click="previousPage()">
        <i class="icon-chevron-left"></i>
      </div>

      <span class="pagination-wrapper mr-2">
        <v-layout  row class="align-baseline ma-0 pa-0">
        <i v-if="(pageArray.length && pageArray[0] > 1)" class="icon-ellipsis-h"></i>

        <template v-for="(p, i) in pageArray">
          <div @click="changePageAction(p)" :key="`${i}-page`">
            <PageNumber :numeral="p" 
                        :marked="isGroupMarking && groupList && p <= groupList.length ? groupList[p-1].marked : false" 
                        :selected="p === currentPage"/>
          </div>
        </template>

        <i v-if="(pageArray.length && pageArray[pageArray.length - 1] < totalPages - 1)" class="icon-ellipsis-h"></i>

        <div v-if="(pageArray.length && pageArray[pageArray.length - 1] < totalPages)" 
            @click="changePageAction(totalPages)" :key="`${totalPages}-page`">
          <PageNumber :numeral="totalPages" 
                      :marked="isGroupMarking && groupList && groupList[totalPages - 1].marked " 
                      :selected="totalPages === currentPage"/>
        </div>
        </v-layout>
      </span>

      <div :class="`squircular-icon next-btn ${currentPage === totalPages ? 'disabled-button-cs': 'uq'}`" @click="nextPage()">
        <i class="icon-chevron-right"></i>
      </div>

      <div :class="`squircular-icon end-btn ${currentPage === totalPages ? 'disabled-button-cs': 'uq'}`" @click="lastPage()">
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
      if (totalPages < numVisiblePageButtons) {
        numVisiblePageButtons = totalPages;
      }

      const startPage = Math.min(Math.max(currentPage - ~~(numVisiblePageButtons / 2), 1), totalPages - numVisiblePageButtons + 1);

      for (let i = 0; i < numVisiblePageButtons; i++) {
        pageArray.push(i + startPage);
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
</style>