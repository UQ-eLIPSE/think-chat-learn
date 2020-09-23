<template>
  <div class="form-control input-autocomplete">
    <div class="editable-field">
      <input type="text" @input="(e) => onQuery(e.currentTarget.value)">
      <div class="dropdown-list card-container">
        <template v-for="n in 10">
          <div :key="n" class="dropdown-list-item">
            <p>Something item</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/partial/variables.scss";

.dropdown-list-item{
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
export default class Collapsible extends Vue {
  //@Prop({required: false, default: ""}) private title!: string;
  //@Prop({}) private itemList!: IDropdownItem[];
  
  onQuery(query: string){

  }

  onClickItem(){

  }

  onUseArrow(){

  }

}
</script>