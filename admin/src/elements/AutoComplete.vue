<template>
  <div class="form-control input-autocomplete">
    <div class="editable-field">
      <input type="text" @input="(e) => onQuery(e.currentTarget.value)" v-model="displayValue">
      <div class="dropdown-list card-container">

        <template v-for="(item, idx) in itemList">
          <div :key="`item-${idx}`" class="dropdown-list-item" @click="onClickItem(idx)">
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
}

.dropdown-list-item{
  padding: 0.5rem 1rem;

  &:hover {
    background-color: rgba($uq, 0.1);
  }

  &.key-selected {
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

@Component
/**
 * <AutoComplete :itemList="generatedList" :value="currentValue" @click="onClick"/>
*/
export default class Collapsible extends Vue {
  @Prop({required: false, default: ""}) private title!: string;
  @Prop({required: false, default: ""}) private value!: string;
  @Prop({required: true, default: () => []}) private itemList!: IDropdownItem[];

  private displayValue = this.value || "";
  private isQuerying
  onQuery(query: string){
    this.$emit('input', query);
  }

  onClickItem(index: number){
    this.displayValue = this.itemList[index].label;
    this.$emit('click', index);
  }

  onUseArrow(){

  }

}
</script>