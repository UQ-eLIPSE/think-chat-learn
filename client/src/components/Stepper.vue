<template>
  <div
    class="stepper"
    :style="`width: ${steps.length * 100}px`"
  >
    <ul>
      <span class="bar"></span>
      <li v-for="(step, index) in steps" :key="index">
        <span
          class="status"
          :class="step.status"
        >
          <font-awesome-icon
            v-if="step.status === Progress.COMPLETE"
            icon="check"
          />
          <font-awesome-icon
            v-if="step.status === Progress.IN_PROGRESS"
            icon="redo-alt"
          />
        </span>
        <span
          class="title"
          :class="step.status"
        >{{ step.title }}</span>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

.stepper {
  margin: 0 auto;
  padding: 1.875em;

  ul {
    display: flex;
    justify-content: space-between;

    .bar {
      background-color: $text;
      content: "";
      display: block;
      height: 5px;
      position: absolute;
      width: 110px;
      right: 55px;
      top: -25px;
    }

    li {
      margin: 0 auto;
      width: 85px;
      position: relative;

      &:first-child .title:before {
        background-color: transparent !important;
      }
      .status {
        border-radius: 20px;
        display: block;
        margin: 0 auto 10px auto;

        > svg {
          color: $white;
          margin-left: 4px;
          margin-top: 5px;

          &.fa-redo-alt {
            animation: fa-spin 5s infinite linear;
          }
        }

        &.complete {
          background-color: $text;
          height: 25px;
          width: 25px;
        }

        &.in-progress {
          background-color: $baseLight4;
          height: 25px;
          width: 25px;
        }

        &.to-do {
          border: 5px solid $tertiaryBg;
          border-radius: 50%;
          box-shadow: 0 0 1px 0px $white;
          height: 25px;
          width: 25px;
        }
      }

      .title {
        color: $tertiaryBg;
        display: block;
        font-size: 1em;
        font-weight: 700;
        margin-top: 5px;
        position: relative;
        text-align: center;

        // Background bar - if number of steps ever becomes a set number this would be nice to re-implement
        // &:before {
        //   content: "";
        //   height: 5px;
        //   position: absolute;
        //   width: 6.7rem;
        //   right: 55px;
        //   top: -25px;
        // }

        &.complete {
          color: $text;

          &:before {
            background-color: $text;
          }
        }

        &.in-progress {
          color: $baseLight4;
          &:before {
            background: linear-gradient(to right, $text 0%, $baseLight4 100%);
          }
        }

        &.to-do {
          color: $tertiaryBg;
          &:before {
            background-color: $tertiaryBg;
          }
        }
      }
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { IQuiz } from "../../../common/interfaces/ToClientData";

enum Progress {
  COMPLETE = "complete",
  IN_PROGRESS = "in-progress",
  TO_DO = "to-do"
};

interface Steps {
  title: string;
  status: Progress
};

@Component({})
export default class Stepper extends Vue {

  /** The offset of the receipt page relative to the end of quiz pages */
  RECEIPT_OFFSET = 1;

  /** The offset of the reflection page relative to the end of quiz pages */
  REFLECTION_OFFSET = 0;

  get currentIndex(): number {
    return 1;
  }

  get Progress() {
    return Progress;
  }

  /**
   * Computation of the steps is simply a matter of grabbing the quizzes
   * for the titles and then checking the current index for progression.
   * 
   * Note that suppose the index was 3, then it is assumed that indices 
   * 2 and 1 are completed.
   */
  get steps(): Steps[]{
    if (!this.quiz|| !this.quiz.pages) {
      return [];
    } else {
      // This is the initial quiz pages
      const arr = this.quiz.pages.reduce((arr: Steps[], element, index) => {

        let status: Progress;

        status = this.computeStatus(this.currentIndex, index);

        const output : Steps = {
          title: element.title,
          status
        };

        arr.push(output);
        return arr;
      }, []);

      // Always form the computation of reflection and receipt
      const reflection: Steps = {
        title: "Reflection",
        status: this.computeStatus(this.currentIndex, this.quiz.pages.length + this.REFLECTION_OFFSET)
      }

      const receipt: Steps = {
        title: "Receipt",
        status: this.computeStatus(this.currentIndex, this.quiz.pages.length + this.RECEIPT_OFFSET)
      }

      arr.push(reflection);
      arr.push(receipt);

      return arr;
    }
  }

  get quiz(): IQuiz | null {
    return this.$store.getters.quiz;
  }

  /**
   * Based on the index of the element and the benchmark to meet,
   * computes the status
   */
  private computeStatus(index: number, benchmark: number): Progress {
    let status: Progress;

    if (benchmark===  index) {
      status = Progress.IN_PROGRESS;
    } else if (benchmark < index) {
      status = Progress.COMPLETE
    } else {
      status = Progress.TO_DO;
    }

    return status;
  }
}
</script>
