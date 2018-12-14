<template>
    <div class="container">
        <h1>Some Survey here</h1>
        <div class="div-body">
            <p>Arbitrary filler text for survey</p>
            <p>Put some answer here: <input type="text"/></p>
            <p>Put some confidence value here</p>
        </div>                
    </div>
</template>

<style scoped>
</style>

<script lang="ts">
import {Vue, Component} from "vue-property-decorator";

@Component({})
export default class Survey extends Vue {
    
}
</script>