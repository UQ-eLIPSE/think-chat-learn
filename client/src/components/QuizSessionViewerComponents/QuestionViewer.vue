<template>
    <InfoViewer :contentLeft="[questionContent]" />
    
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import { Page } from "../../../../common/interfaces/DBSchema";
import InfoViewer from "./InfoViewer.vue";

@Component({
  components: {
    InfoViewer
  }
})
export default class QuestionViewer extends Vue {
  @Prop({ default: undefined, required: true }) questionPage!: Page;
  @Prop({ default: undefined, required: true }) responseContent!: string;

  get questionContent() {
    return this.questionPage && this.questionPage.content ? this.questionPage.content: '';
  }

}
</script>

<style scoped lang="scss">
.content {
    // background-color: #fafafa;
    flex: 0.5;
}

.flex-row {
    display: flex;
}

.flex-col {
    display: flex;
    flex-direction: column;
}
</style>