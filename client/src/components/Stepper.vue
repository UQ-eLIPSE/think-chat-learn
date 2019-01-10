<template>
  <div class="stepper">

    <font-awesome-icon icon="redoAlt" />

    <ul>
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
.stepper {
  margin: 0 auto;
  padding: 1.875em;
  width: 861px;
  ul {
    display: flex;
    justify-content: space-between;

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

@Component({})
export default class Stepper extends Vue {
  steps = [
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
      title: "Reflection",
      status: "complete"
    },
    {
      title: "Survey",
      status: "to-do"
    },
    {
      title: "Receipt",
      status: "to-do"
    }
  ];
}
</script>
