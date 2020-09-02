<template>
  <div class="quiz-session-list-item" :class="quizItemClasses" @click="clickHandler">
    <div class="col">
      <h2>{{heading}}</h2>
      <h6 v-for="subheading in subheadings" :key="subheading">{{ subheading }}</h6>
    </div>

    <div class="col">
      <button
        v-if="actionButton && actionButton.text"
        :class="actionButtonClasses"
        @click.stop="actionClickHandler"
      >
      {{ actionButton.text }}
        <span v-if="actionButton && actionButton.icon" class="icon-container">
          <font-awesome-icon :icon="actionButton.icon" />
        </span>
      </button>
      
    </div>
  </div>
</template>

<style lang="scss" scoped>
.quiz-session-list-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 0.01rem solid rgba(215, 209, 204, 0.28);
  background: white;

  &.clickable {
    cursor: pointer;

    &:hover {
      background: rgba(215, 209, 204, 0.15);
    }
  }

  &.disabled {
    opacity: 0.2;
  }
  .col {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .flex-center {
    align-items: center;
    justify-content: center;
  }

  .action-button {
    display: flex;
    padding: 0.25rem;
    font-size: 0.8rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    min-width: 5rem;
    &.green {
      background: $green;
      color: white;
      box-shadow: 0 4px 6px -6px rgba(0, 0, 0, 0.15);
    }

    &.purple {
      background: rgba(81, 36, 122, 0.2);
      color: rgba(81, 36, 122, 0.9);
    }

    &.text {
      background: none;
      color: $purple;
      border: 0.05em solid $purple;
    }

    &:hover, &:active, &:focus {
      opacity: 0.9;
      outline: none;
    }
  }

  .disable {
    opacity: 0.2;
  }

  .icon-container {
    padding-left: 0.1rem;
  }
}
</style>

<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import {
  IUser,
  IQuiz,
  IQuizSession,
  IUserSession,
} from "../../../common/interfaces/ToClientData";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../../common/interfaces/IWSToServerData";
import { SocketState, TimerSettings } from "../interfaces";
import { WebsocketManager } from "../../../common/js/WebsocketManager";
import { WebsocketEvents } from "../../../common/js/WebsocketEvents";
import { EventBus } from "../EventBus";
import { EmitterEvents } from "../emitters";

@Component
export default class QuizSessionListItem extends Vue {
  @Prop({ default: undefined }) private heading!: string;
  @Prop({ default: undefined }) private subheadings!: string[];
  @Prop({ default: undefined }) private actionButton!:
    | { mode: "green" | "purple"; text: string, icon?: string }
    | undefined;
  @Prop({ default: false }) private disabled!: boolean;
  @Prop({ default: false }) private clickable!: boolean;
  @Prop({ default: undefined }) private backgroundColor!: string;

  clickHandler() {
    this.$emit("click");
  }

  actionClickHandler() {
    this.$emit("actionClick");
  }

  get quizItemClasses() {
    return {
      disabled: this.disabled,
      clickable: this.clickable,
    };
  }
  get actionButtonClasses() {
    if (this.actionButton && this.actionButton.mode) {
      const classes: { [key: string]: boolean } = {
        "action-button": true,
        "flex-center": true,
      };

      classes[this.actionButton.mode] = true;

      return classes;
    }

    return undefined;
  }

}
</script>
