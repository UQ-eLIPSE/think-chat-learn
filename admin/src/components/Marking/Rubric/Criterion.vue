<template>
  <div class="criterion flex-row">
    <div class="criterion-container flex-col">
      <span class="criterion-title">{{ criterionName }}</span>
      <Points @marked="markedHandler" :totalPoints="maximumMarks" :currentPoints="mark.value" />
    </div>
    <div class="comments-icon">
      <div class="circular-icon toggle-comment" @click.prevent="toggleComments()" >
        <i class="icon-chat" title="Add Comment"/>
        <span v-if="mark && mark.feedback" class="marked">
          <div class="circular-icon green-cl-solid">
            <i class="icon-check"/>
          </div>
        </span>
      </div>

      <div v-show="commentsVisible" class="comments-box flex-row">
        <textarea
          v-if="mark && typeof mark.feedback === 'string'"
          v-model="mark.feedback"
          @input="markChanged(true)"
          placeholder="Comment ..."
        />
        <div class="circular-icon comment-close">
          <i class="icon-chevron-down" @click.prevent="commentsVisible = false" />
        </div>
      </div>
    </div>
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

  markChanged(changed: boolean) {
    setMarkChangedFlag(changed);
  }

  markedHandler(point: number) {
    this.mark.value = point;
    this.markChanged(true);
  }

  get criterionName() {
    return (this.criterion && this.criterion.name) || "";
  }

  toggleComments() {
    this.commentsVisible = !this.commentsVisible;
  }
}
</script>
<style lang="scss" scoped>
@import "../../../../css/partial/variables";
@import "../../../../css/partial/fonts";
@import "../../../../css/partial/icons";

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
    display: flex;
    align-self: flex-end;
    position: relative;
    font-size: 1.4em;


    .marked {
      position: absolute;
      right: 2px;
      top: 2px;
      .circular-icon {
        @include icon-wrapper-shape(50%, 11, 0.6);
      }
    }

    i {
      cursor: pointer;
      border-radius: 50%;
      background: transparent;
    }

    .toggle-comment > i, .comment-close > i {
      color: $primary;
      padding: 0.25rem;

      &:hover {
        background: rgba(1, 0, 0, 0.09);
      }
    }
    
    .comment-close {
      align-self: flex-start;
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
      justify-content: space-between;
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
        overflow: auto;
        border: none;
        font-size: 0.875em;

        &:hover,
        &:focus,
        &:active {
          outline: none;
        }
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