<template>
  <div
    class="stepper"
    :style="`width: ${steps.length * 100}px`"
  >
    <ul>
      <span class="bar"></span>
      <li v-for="step in steps">
        <span
          class="status"
          :class="step.status"
        >
          <font-awesome-icon
            v-if="step.status === 'complete'"
            icon="check"
          />
          <font-awesome-icon
            v-if="step.status === 'in-progress'"
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

@Component({})
export default class Stepper extends Vue {
  // @Prop({}) private steps!: number;
  private steps = [
    {
      title: "Question",
      status: "complete"
    },
    {
      title: "Group",
      status: "complete"
    },
    {
      title: "Discussion",
      status: "in-progress"
    },
    {
      title: "Discussion",
      status: "in-progress"
    },
    {
      title: "Discussion",
      status: "in-progress"
    },
    {
      title: "Group",
      status: "complete"
    },
    {
      title: "Discussion",
      status: "in-progress"
    },
    {
      title: "Discussion",
      status: "in-progress"
    },
    {
      title: "Discussion",
      status: "in-progress"
    },
    {
      title: "Discussion",
      status: "in-progress"
    },
    {
      title: "Discussion",
      status: "in-progress"
    },
    {
      title: "Group",
      status: "complete"
    },
    {
      title: "Discussion",
      status: "in-progress"
    },
    {
      title: "Discussion",
      status: "in-progress"
    },
    {
      title: "Discussion",
      status: "in-progress"
    }
  ];
}
</script>
