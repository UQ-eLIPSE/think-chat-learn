<template>
  <div class="stepper">

    <font-awesome-icon icon="redoAlt" />

    <ul>
      <li v-for="(step, index) in steps" :key="index">
        <span
          class="status"
          :class="[step.status, step.relativeIndex === currentIndex ? 'gold-border' : '']"
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
.stepper {
  margin: 0 auto;
  padding: 1.875em;
  width: 861px;
  .gold-border {
    border: 1px solid yellow;
  }
  ul {
    display: flex;
    justify-content: space-between;

    /* Fixes the case where the first list element is in progress. It's a lot easier to override
    then to create an overly complex rule to bring this element as an exception */
    li:first-child {
      .title {
        &.in-progress {
          &:before {
            width: 0px;
            height: 0px;
          }
        }
      }
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
          color: white;
          margin-left: 4px;
          margin-top: 5px;

          &.fa-redo-alt {
            animation: fa-spin 5s infinite linear;
          }
        }

        &.complete {
          background-color: #515456;
          height: 25px;
          width: 25px;
        }

        &.in-progress {
          background-color: #fa7357;
          height: 25px;
          width: 25px;
        }

        &.to-do {
          border: 5px solid #a9aaab;
          border-radius: 50%;
          box-shadow: 0 0 1px 0px white;
          height: 25px;
          width: 25px;
        }
      }

      .title {
        color: #a9aaab;
        display: block;
        font-size: 1em;
        font-weight: 700;
        margin-top: 5px;
        position: relative;
        text-align: center;
        &:before {
          background-color: #a9aaab;
          content: "";
          height: 5px;
          position: absolute;
          width: 109px;
          right: 55px;
          top: -25px;
        }

        &.complete {
          color: #515456;

          &:before {
            background-color: #515456;
            content: "";
            height: 5px;
            position: absolute;
            width: 108px;
            right: 55px;
            top: -25px;
          }

          &:first-child:before {
            content: "";
          }
        }

        &.in-progress {
          color: #fa7357;
          &:before {
            background: linear-gradient(to right, #515456 0%, #ff7659 100%);
            content: "";
            height: 5px;
            position: absolute;
            width: 110px;
            right: 55px;
            top: -25px;
          }
        }

        &.to-do {
          color: #a9aaab;
          &:before {
            background-color: #a9aaab;
            content: "";
            height: 5px;
            position: absolute;
            width: 109px;
            right: 55px;
            top: -25px;
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
}

interface Steps {
  title: string;
  status: Progress;
  relativeIndex: number;
}

@Component({})
export default class Stepper extends Vue {

  /** The offset of the receipt page relative to the end of quiz pages */
  private RECEIPT_OFFSET = 0;

  // Offsets the current index by 1 due to store value referring to position in array
  private INDEX_OFFSET = 0;

  // The amount of steps to show on one side
  private STEP_AMOUNT = 3;

  get currentIndex(): number {
    return this.$store.getters.currentIndex + this.INDEX_OFFSET;
  }

  get maxIndex(): number {
    return this.$store.getters.maxIndex + this.INDEX_OFFSET;
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
  get steps(): Steps[] {
    if (!this.quiz || !this.quiz.pages) {
      return [];
    } else {
      // This is the initial quiz pages
      const arr = this.quiz.pages.reduce((steps: Steps[], element, index) => {

        let status: Progress;

        status = this.computeStatus(this.maxIndex, index);

        const output: Steps = {
          title: element.title,
          status,
          relativeIndex: index
        };

        steps.push(output);
        return steps;
      }, []);

      const receipt: Steps = {
        title: "Receipt",
        status: this.computeStatus(this.maxIndex, this.quiz.pages.length + this.RECEIPT_OFFSET),
        relativeIndex: this.quiz.pages.length + this.RECEIPT_OFFSET
      };

      arr.push(receipt);

      // Slice the arr based on how much you want to show
      // There are 3 outcomes. Overflow left, overflow right and middle segment
      if (this.currentIndex - this.STEP_AMOUNT <= 0) {
        return arr.slice(0, 2 * this.STEP_AMOUNT);
      } else if (this.currentIndex + this.STEP_AMOUNT >= arr.length) {
        return arr.slice(arr.length - (2 * this.STEP_AMOUNT), arr.length);
      } else {
        return arr.slice(this.currentIndex - this.STEP_AMOUNT, this.currentIndex + this.STEP_AMOUNT);
      }
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

    if (benchmark === index) {
      status = Progress.IN_PROGRESS;
    } else if (benchmark < index) {
      status = Progress.COMPLETE;
    } else {
      status = Progress.TO_DO;
    }

    return status;
  }
}
</script>
