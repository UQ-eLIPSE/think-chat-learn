<template>
  <div class="form-control input-autocomplete">
    <div :class="`${type === 'text'? 'editable-field': 'search-field'}`">
      <input :type="type" v-model="displayValue" :title="title"
              @input="(e) => onQuery(e.currentTarget.value)">

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

<style lang="scss">
</style>

<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";

export interface IDropdownItem {
  label: string;
  value: string;
}

/**Usage
 * <AutoComplete type="search" :itemList="generatedList" :defaultValue="defaultValue" @click="onClick"/>
 * @prop title - input title
 * @prop defaultValue - default input value
 * @prop type - type of the input
 * @prop itemList - dropdown item queried by input value
*/
@Component
export default class Collapsible extends Vue {
  @Prop({required: false, default: ""}) private title!: string;
  @Prop({required: false, default: ""}) private defaultValue!: string;
  @Prop({required: true, default: "text"}) private type!: "text" | "search";
  @Prop({required: true, default: () => []}) private itemList!: IDropdownItem[];

  private displayValue: string = this.defaultValue|| "";
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
    this.$emit('click', this.itemList[index]);
    this.isQuerying = false;
  }

  onFocusOut(e: any){
    if(!this.$el.contains(e.currentTarget)) this.isQuerying = false;
  }

}
</script>