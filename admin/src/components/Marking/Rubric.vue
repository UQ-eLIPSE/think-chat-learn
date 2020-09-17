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
        :key="`${criterionObject.criterion._id}-criterion`"
      />
    </div>
    <div class="general-feedback">
      <h5>General feedback</h5>
      <div class="form-control">
        <div class="editable-field">
          <textarea />
        </div>
      </div>
    </div>
    <button type="button" class="primary-cl save-marks" @click.prevent="saveMarksHandler">Save</button>
  </div>
</template>



<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import {
  ICriteria,
  Mark,
  MarkCriteria,
} from "../../../../common/interfaces/DBSchema";
import Criterion from "./Criterion/Criterion.vue";

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
    return [
      {
        _id: "1",
        name: "Evaluating and Interpreting",
        course: "ENGG1200",
      },
      {
        _id: "2",
        name: "Depth of Reflection",
        course: "ENGG1200",
      },
      {
        _id: "3",
        name: "Depth of Reflection and a long name",
        course: "ENGG1200",
      },
    ];
  }

  get marksList(): MarkCriteria[] {
    return this.mark && this.mark.marks
      ? this.mark.marks || []
      : [
          {
            value: 2,
            criteriaId: "1",
            feedback: "abcdefghi",
          } as any,
          {
            value: 4,
            criteriaId: "2",
          },
        ];
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

  saveMarksHandler() {
      this.$emit("saved");
  }
}
</script>
<style lang="scss" scoped>
@import "../../../css/partial/variables";
@import "../../../css/partial/containers";
.rubric {
  display: flex;
  flex-direction: column;
  background: $white;
  width: 220px;
  align-items: center;
  border: 0.01em solid transparent;
  border-radius: 10px;
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

    height: 100px;

    padding: 0.5rem 0;
    h5 {
      color: $dark-grey;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    textarea {
      width: 100%;
      height: 85%;
      // border: 0.01em solid $border-grey;
      // overflow: scroll;
      // padding: 0.5rem;
      // border-radius: 5px;
      // &:hover,
      // &:focus,
      // &:active {
      //   outline: none;
      // }
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