<template>
  <div
    class="stepper"
    :style="`width: ${steps.length * 100}px`"
    v-if="renderBasedOnRoute"
  >
    <ul>
      <font-awesome-icon
        :style="(currentIndex > 0) ? { color: 'green' } : { color: 'grey' }"
        icon="arrow-left"
        @click="(currentIndex > 0) ? goToPreviousPage() : () => {}"
      />
      <span class="bar"></span>
      <button
        :class="[ !(currentIndex > 0) ? 'disabled' : '', 'primary']"
        :disabled="!(currentIndex > 0)"
        @click="goToPreviousPage()"
      />
      <li
        v-for="(step, index) in steps"
        :key="index"
      >
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
      <font-awesome-icon
        :style="(maxIndex > currentIndex) ? { color: 'green' } : { color: 'grey' }"
        icon="arrow-right"
        @click="(maxIndex > currentIndex) ? goToNextPage(): () => {}"
      />
    </ul>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

.stepper {
  margin: 0 auto;
  padding: 1.875em;
  .gold-border {
    border: 1px solid yellow;
  }
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
    /* Fixes the case where the first list element is in progress. It's a lot easier to override
    then to create an overly complex rule to bring this element as an exception */
    li:nth-of-type(1) {
      .title {
        &:before {
          width: 0px;
          height: 0px;
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
        &:before {
          content: "";
          height: 5px;
          position: absolute;
          width: 3.8rem;
          right: 55px;
          top: -25px;
        }

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
import { Names } from "../router";

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

  get renderBasedOnRoute() {
    return this.$route.name === Names.MOOCCHAT_PAGE;
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
        status: this.computeStatus(
          this.maxIndex,
          this.quiz.pages.length + this.RECEIPT_OFFSET
        ),
        relativeIndex: this.quiz.pages.length + this.RECEIPT_OFFSET
      };

      arr.push(receipt);

      // Slice the arr based on how much you want to show
      // There are 3 outcomes. Overflow left, overflow right and middle segment
      if (this.currentIndex - this.STEP_AMOUNT <= 0) {
        return arr.slice(0, 2 * this.STEP_AMOUNT);
      } else if (this.currentIndex + this.STEP_AMOUNT >= arr.length) {
        return arr.slice(arr.length - 2 * this.STEP_AMOUNT, arr.length);
      } else {
        return arr.slice(
          this.currentIndex - this.STEP_AMOUNT,
          this.currentIndex + this.STEP_AMOUNT
        );
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

  // Goes the to the next page by incrementing the current count
  private goToNextPage() {
    if (!this.quiz || !this.quiz.pages) {
      return;
    }

    // Remember to increment afterwards
    this.$store.dispatch("incrementCurrentIndex");
  }

  private goToPreviousPage() {
    if (!this.quiz || !this.quiz.pages) {
      return;
    }

    this.$store.dispatch("decrementCurrentIndex");
  }
}
</script>
