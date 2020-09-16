<template>
  <div class="rubric flex-col">
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
        Criterion
    }
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
      ];
  }

  get marksList(): MarkCriteria[] {
    return this.mark && this.mark.marks
      ? this.mark.marks || []
      : [
          {
            value: 2,
            criteriaId: "1",
            feedback: 'abcdefghi'
          } as any,
          {
            value: 4,
            criteriaId: "2",
          },
        ];
  }

  get criteriaMarkObjects(): { criterion: ICriteria, mark: MarkCriteria | undefined }[] {
    if (!this.criterionList || !this.criterionList.length) return [];
    return this.criterionList.map((c) => {
      const mark = this.marksList.find((m) => m.criteriaId === c._id);
      return {
        criterion: c,
        mark: mark,
      };
    });
  }
}
</script>
<style lang="scss" scoped>
@import "../../../css/partial/variables";
.rubric {
    display: flex;
    flex-direction: column;
    background: $white;
    width: 210px;
    align-items: center;
    border: 0.01em solid transparent;
    border-radius: 10px;
    .rubric-heading {
        color: $uq;
        margin: 0.5rem;
    }

    .rubric-criterion {
        padding: 0.5rem 0;
        border-bottom: 0.01rem solid transparentize($color: $dark-grey, $amount: 0.8);
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