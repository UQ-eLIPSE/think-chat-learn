<template>
  <div class="marking-rubric"
       v-if="markingConfig">
    <div v-if="isElipssMark">
      <ElipssMarkingComponent></ElipssMarkingComponent>


    </div>

    <div v-else-if="isSimpleMark">

    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { IQuiz, QuizScheduleDataAdmin, Page, IDiscussionPage, IQuestionAnswerPage, QuizSessionDataObject } from "../../../../common/interfaces/ToClientData";
import { PageType } from "../../../../common/enums/DBEnums";
import * as Schema from "../../../../common/interfaces/DBSchema";
import ElipssMarkingComponent from "./ElipssMarkingComponent.vue";


@Component({
  components: {
    ElipssMarkingComponent
  }
})
export default class MarkingComponent extends Vue {
  get quiz() {
    return this.$store.getters.currentQuiz;
  }

  get markingConfig() {
    if(!this.quiz) return undefined;
    return this.quiz.markingConfiguration;
  }
 
  get isElipssMark() {
    if (!this.quiz || !this.markingConfig) return false;
    return this.quiz.markingConfiguration.type === Schema.MarkMode.ELIPSS_MARKING;
  }

  get isSimpleMark() {
    if (!this.quiz || !this.markingConfig) return false;
    return this.quiz.markingConfiguration.type === Schema.MarkMode.SIMPLE_MARKING;
  }
  
}
</script>
<style scoped>
.sidebar {
  color: white;
  text-shadow: rgb(85, 85, 85) 0.05em 0.05em 0.05em;
  width: 18rem;
  font-size: 1.2rem;
  overflow-y: hidden;
  background: rgb(150, 85, 102);
}

.course-name {
  font-style: italic;
  margin: 1rem 2rem 1.5rem;
}

.moochat-name {
  line-height: 1;
  margin: 2rem 2rem 1rem;
}

.question-box {
  display: flex;
  flex-direction: column;
  border: 0.1em solid teal;
  padding: 0.5rem;
}
</style>