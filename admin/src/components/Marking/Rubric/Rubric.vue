<template>
  <div class="card-container rubric flex-col">
    <h3 class="rubric-heading">Rubric - {{ username }}</h3>
    <div class="criteria">
      <Criterion
        class="rubric-criterion"
        v-for="criterionObject in criteriaMarkObjects"
        :criterion="criterionObject.criterion"
        :mark="criterionObject.mark || 0"
        :maximumMarks="maximumMarks"
        :key="`${username || ''}-${criterionObject.criterion._id}-criterion`"
      />
    </div>
    <div class="general-feedback">
      <h5>General feedback</h5>
      <div class="form-control">
        <div class="editable-field">
          <textarea v-if="mark && typeof mark.feedback === 'string'" @input="markChangedHandler(true)" v-model="mark.feedback" />
        </div>
      </div>
    </div>
    <button type="button" class="primary-cl save-marks button-cs" @click.prevent="saveMarksHandler">Save</button>
  </div>
</template>



<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import {
  ICriteria,
  Mark,
  MarkCriteria,
} from "../../../../../common/interfaces/DBSchema";
import { setMarkChangedFlag } from "../../../util/MarkChangeTracker";
import Criterion from "./Criterion.vue";

@Component({
  components: {
    Criterion,
  },
})
export default class Rubric extends Vue {
  @Prop({ required: true, default: () => "" }) private username!: string;
  @Prop({ required: true, default: () => [] }) private criteria!: ICriteria[];
  @Prop({ required: true, default: () => undefined }) private mark!: Mark;
  @Prop({}) private maximumMarks!: number;

  get criterionList(): ICriteria[] {
    return this.criteria || [];
  }

  get marksList(): MarkCriteria[] {
    return this.mark && this.mark.marks
      ? this.mark.marks || []
      : [];
  }

  get criteriaMarkObjects(): {
    criterion: ICriteria;
    mark: MarkCriteria | undefined;
  }[] {
    if (!this.criterionList || !this.criterionList.length) return [];
    return this.criterionList.map((c) => {
      const mark = this.marksList.find((m) => m.criteriaId === c._id);
      return {
        criterion: c,
        mark: mark,
      };
    });
  }

  markChangedHandler(changed: boolean) {
    setMarkChangedFlag(changed);
  }

  saveMarksHandler() {
      this.$emit("saved");
  }
}
</script>
<style lang="scss" scoped>
@import "../../../../css/partial/variables";
@import "../../../../css/partial/containers";
@import "../../../../css/partial/button";
.rubric {
  display: flex;
  flex-direction: column;
  background: $white;
  width: 220px;
  align-items: center;
  border: 0.01em solid transparent;
  border-radius: 10px;
  text-overflow: ellipsis;
  word-break: break-word;
  
  .rubric-heading {
    color: $uq;
    align-self: flex-start;
  }

  &.card-container {
      width: 220px;
      padding: 1.5rem;
  }

  .rubric-criterion {
    padding: 0.75rem 0;
    border-bottom: 0.01rem solid
      transparentize($color: $dark-grey, $amount: 0.8);
  }

  .general-feedback {
    margin: 0.25rem 0;
    width: 180px;
    padding: 0.5rem 0;
    h5 {
      color: $dark-grey;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    textarea {
      width: 100%;
      height: 100px;
      font-size: 0.875em;
    }
  }

  .save-marks {
      width: 100%;
      margin-top: 1rem;
  }
}

.flex-row {
  display: flex;
}

.flex-col {
  display: flex;
  flex-direction: column;
}
</style>