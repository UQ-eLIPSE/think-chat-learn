<template>
  <div class="form-control input-autocomplete">
    <div :class="`${type === 'text'? 'editable-field': 'search-field'}`">
      <input :type="type" v-model="displayValue"
              @input="(e) => onQuery(e.currentTarget.value)"
              @keydown.up="onArrowUp"
              @keydown.down="onArrowDown"
              @keydown.enter="onChooseItem(highlightItemIndex)">

      <div class="dropdown-list card-container" v-if="isQuerying">
        <template v-for="(item, idx) in itemList">
          <div :key="`item-${idx}`" :class="`dropdown-list-item`" 
                @click="onChooseItem(idx)">
            {{item.label}}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/partial/variables.scss";
.dropdown-list{
  padding: 0 0 5px 0;
  border-radius: 0 0 5px 5px;
  position: absolute;
  top: 30px;
  max-height: 225px;

  overflow-y: auto;
}

.dropdown-list-item{
  padding: 0.5rem 1rem;
  height: 40px;

  &:hover {
    background-color: rgba($uq, 0.15);
    color: $uq;
  }
}
</style>

<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";

export interface IDropdownItem {
  label: string;
  value: string;
}

/**
 * <AutoComplete :itemList="generatedList" :value="currentValue" @click="onClick"/>
*/
@Component
export default class Collapsible extends Vue {
  @Prop({required: false, default: ""}) private title!: string;
  @Prop({required: false, default: ""}) private value!: string;
  @Prop({required: true, default: "text"}) private type!: "text" | "search";
  @Prop({required: true, default: () => []}) private itemList!: IDropdownItem[];

  private displayValue: string = this.value || "";
  private isQuerying: boolean = false;

  private mounted(){
    document.addEventListener('click', this.onFocusOut);
  }

  private destroyed(){
    document.removeEventListener('click', this.onFocusOut);
  }

  onQuery(query: string){
    if (!query || !query.length){
      this.isQuerying = false;
      return;
    }
    this.isQuerying = true;
    this.$emit('input', query);
  }

  onChooseItem(index: number){
    this.displayValue = this.itemList[index].label;
    this.$emit('click', index);
    this.isQuerying = false;
  }

  onFocusOut(e: any){
    if(!this.$el.contains(e.currentTarget)) this.isQuerying = false;
  }

}
</script>