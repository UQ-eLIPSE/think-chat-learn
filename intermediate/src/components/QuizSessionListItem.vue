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
      >{{ actionButton.text }}</button>
    </div>
  </div>
</template>

<style scoped>
.quiz-session-list-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border: 0.01rem solid rgba(215, 209, 204, 0.28);
}
.quiz-session-list-item.clickable {
  cursor: pointer;
}

.quiz-session-list-item.clickable:hover {
  background: rgba(215, 209, 204, 0.15);
}

.quiz-session-list-item.disabled {
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
}
.action-button.green {
  background: darkgreen;
  color: white;
}

.action-button.purple {
  background: rgba(81, 36, 122, 0.2);
  color: rgba(81, 36, 122, 0.9);
}

.action-button.text {
  background: none;
  color: rgba(81, 36, 122, 0.2);
  border: 0.05em solid rgba(81, 36, 122, 0.2);
}

.action-button:hover,
.action-button:active,
.action-button:focus {
  opacity: 0.9;
  outline: none;
}

.action-button.disable {
  opacity: 0.2;
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
import { SocketState } from "../interfaces";
import { WebsocketManager } from "../../../common/js/WebsocketManager";
import { WebsocketEvents } from "../../../common/js/WebsocketEvents";

@Component
export default class QuizSessionListItem extends Vue {
  @Prop({ default: undefined }) private heading!: string;
  @Prop({ default: undefined }) private subheadings!: string[];
  @Prop({ default: undefined }) private actionButton!:
    | { mode: "green" | "purple"; text: string }
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
