<template>
  <div class="criterion flex-row">
    <div class="criterion-container flex-col">
      <span class="criterion-title">{{ criterionName }}</span>
      <Points @marked="markedHandler" :totalPoints="maximumMarks" :currentPoints="mark.value" />
    </div>
    <div class="comments-icon" :class="commentClasses">
      <font-awesome-icon
        :class="mark && mark.feedback ? 'glow': ''"
        icon="comment-dots"
        size="2x"
        title="Add Comment"
        @click.prevent="toggleComments()"
      ></font-awesome-icon>
      <div v-show="commentsVisible" class="comments-box flex-row">
        <textarea
          v-if="mark && typeof mark.feedback === 'string'"
          v-model="mark.feedback"
          placeholder="Comment ..."
        />
        <i class="icon-chevron-down" @click.prevent="commentsVisible = false" />
      </div>
    </div>
  </div>
</template>



<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import {
  ICriteria,
  Mark,
  MarkCriteria,
} from "../../../../../common/interfaces/DBSchema";
import Points from "./Points.vue";
@Component({
  components: {
    Points,
  },
})
export default class Criterion extends Vue {
  @Prop({ required: true, default: () => "" }) private criterion!: ICriteria;
  @Prop({}) private maximumMarks!: number;
  @Prop({}) private mark!: MarkCriteria;

  private commentsVisible: boolean = false;

  markedHandler(point: number) {
    this.mark.value = point;
  }

  get criterionName() {
    return (this.criterion && this.criterion.name) || "";
  }

  get commentClasses() {
    return {
      filled: this.mark && (this.mark as any).feedback
    };
  }

  toggleComments() {
    this.commentsVisible = !this.commentsVisible;
  }
}
</script>
<style lang="scss" scoped>
@import "../../../../css/partial/variables";
@import "../../../../css/partial/containers";

.criterion {
  display: flex;
  justify-content: space-between;
  width: 180px;
  font-size: 0.8em;
  align-items: center;

  .criterion-container {
    flex: 0.75;

    .criterion-title {
      display: block;
      font-style: italic;
      color: $dark-grey;
      padding: 0.2rem 0;
    }
  }

  .comments-icon {
    flex: 0.2;
    align-self: flex-end;
    position: relative;

    i,
    svg {
      color: $primary;
      cursor: pointer;
    }

    &.filled {
      i,
      svg {
        color: $primary;
      }
    }

    .glow {
      // TODO: Add glow if comment exists
    }

    .comments-box {
      display: flex;
      align-items: center;
      position: absolute;
      right: 0;
      top: -100px;
      width: 200px;
      height: 90px;
      background: transparentize($color: $white, $amount: 0.1);
      border: 0.01em solid $primary;

      z-index: 999999;
      padding: 0.5rem;
      border-radius: 5px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
      .comment-header {
        width: 100%;
      }

      textarea {
        width: 100%;
        height: 100%;
        overflow: scroll;
        border: none;
        &:hover,
        &:focus,
        &:active {
          outline: none;
        }
      }

      i,
      svg {
        margin-left: auto;
        margin-right: 0;
        align-self: flex-start;
      }
    }
  }
}

.flex-row {
  display: flex;
}

.justify-space-between {
  justify-content: space-between;
}

.flex-col {
  display: flex;
  flex-direction: column;
}
</style>