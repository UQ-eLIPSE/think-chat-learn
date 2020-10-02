<template>
  <div class="validator-wrapper pa-0">
    <slot></slot>
    <v-layout row class="validation-message mt-1" >
      <i v-if="validationMsg && forceShowValidation" 
         :class="`${validationMsg ? 'icon-times-circle': ''} mx-1`"></i>
      <span v-if="validationMsg && forceShowValidation">
        {{validationMsg}}
      </span>
    </v-layout>
  </div>
</template>
<script lang="ts">
import { type } from "jquery";
import { Vue, Component, Watch, Prop } from "vue-property-decorator";

@Component
export default class Validator extends Vue {
  //Rule of validation, e.g (value > 5)
  @Prop({ default: [], required: true }) validationRule!: ((value: any) => boolean | string)[];
  //Force validator to always show 
  @Prop({ default: false, required: false }) forceShowValidation!: string;
  //Value to validate
  @Prop({ default: '', required: true }) value!: any;

  get validationMsg(){
    let validateMsg = '';
    for (let rule of this.validationRule){
      const validateResult = rule(this.value);
      if(typeof validateResult === 'boolean') continue;
      validateMsg = validateResult;
      break;
    }
    return validateMsg;
  }
}
</script>

<style lang="scss" scoped>
@import "../../css/partial/variables.scss";
.validator-wrapper .validation-message{
  color: $red;
  font-size: 0.875em;
  > i {
    margin-top: 2px;
  }
}
</style>