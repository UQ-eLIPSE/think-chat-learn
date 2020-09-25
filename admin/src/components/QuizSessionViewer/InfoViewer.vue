<template>
    <div class="content-wrapper flex-row">
        <div class="content content-left flex-col">
            <div class="content-components" v-for="(c, i) in contentLeft" v-html="c" :key="i"></div>
        </div>
        <div class="content content-right flex-col" v-if="contentRight && contentRight.length">
            <div class="content-components" v-for="(c, i) in contentRight" v-html="c" :key="i"></div>
        </div>
    </div>
    
</template>
<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import { Page } from "../../../../common/interfaces/DBSchema";

@Component
export default class InfoViewer extends Vue {
  @Prop({ default: undefined, required: true }) contentLeft!: string[];
  @Prop({ default: undefined, required: false }) contentRight!: string[];
}
</script>

<style scoped lang="scss">
.content {
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