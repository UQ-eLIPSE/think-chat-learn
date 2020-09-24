<template>
  <div class="form-control input-autocomplete">
    <div :class="`${type === 'text'? 'editable-field': 'search-field'}`">
      <input :type="type" v-model="displayValue" :title="title">

      <div class="dropdown-list card-container" v-if="isQuerying && itemList && itemList.length">
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

<style lang="scss">
</style>

<script lang="ts">
import { Vue, Component, Watch, Prop, Model } from "vue-property-decorator";

export interface IDropdownItem {
  label: string;
  value: string;
}

/**Usage
 * <AutoComplete type="search" v-model="searchTextVariable" :itemList="generatedList" :defaultValue="defaultValue" @click="onClick"/>
 * @prop title - input title
 * @prop defaultValue - default input value
 * @prop type - (required) type of the input
 * @prop itemList - (required) dropdown item queried by input value
*/
@Component
export default class AutoComplete extends Vue {
  @Prop({required: false, default: ""}) private title!: string;
  @Prop({required: false, default: ""}) private defaultValue!: string;
  @Prop({required: true, default: "text"}) private type!: "text" | "search";
  @Prop({required: true, default: () => []}) private itemList!: IDropdownItem[];
  /** Custom v-model `value` prop for the AutoComplete component */
  @Model('input', { type: String }) readonly value!: string;

  private isQuerying: boolean = false;

  private mounted(){
    document.addEventListener('click', this.onFocusOut);
  }

  private destroyed(){
    document.removeEventListener('click', this.onFocusOut);
  }

  /**
   * Returns the value passed from parent
   */
  get displayValue() {
    return this.value;
  }

  /**
   * Setter used to (effectively) set the value in parent
   * This is done by emitting the input event to the parent component
   */
  set displayValue(val: string) {

    this.isQuerying = !!(val && val.length);

    this.$emit('input', val);
  }

  onChooseItem(index: number){
    this.displayValue = this.itemList[index].label;
    this.$emit('click', this.itemList[index]);
    this.isQuerying = false;
  }

  onFocusOut(e: any){
    if(!this.$el.contains(e.currentTarget)) this.isQuerying = false;
  }

}
</script>