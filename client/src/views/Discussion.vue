<template>
    <div id="container">
        <h1>Some Discussion Happens here</h1>
        <div class="div-body">
            <p>Arbitrary filler text for question </p>
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
export default class Discussion extends Vue {

}
</script>