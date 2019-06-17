<template>
    <div class="container">
        <h1 class>Rubric List</h1>
        <router-link tag="button" to="/rubricEditor">Add Rubric</router-link>
        <div v-for="rubric in rubrics" :key="rubric._id" class="rubric">
            <span><b>Rubric Name</b>: {{rubric.name}}</span>
            <br/>
            <button type="button" @click="editRubric(rubric._id)">Edit</button>
            <br/>
            <button type="button" @click="deleteRubric(rubric._id)">Delete</button>            
        </div>        
    </div>
</template>

<style scoped>
    .rubric {
        box-shadow: 1px 1px 1px #888888;
        margin-bottom: 12px;
    }

    .container button:hover {
        background-color: #51247a;
        transition: background-color 1s ease-out;
    }
</style>

<script lang="ts">
import {Vue, Component} from "vue-property-decorator";
import { IRubric } from "../../../common/interfaces/ToClientData";
@Component({})
export default class RubricList extends Vue {

    private async editRubric(id: string) {
        await this.$router.push("/rubricEditor?r=" + id);
    }

    private async deleteRubric(id: string) {
        await this.$store.dispatch("deleteRubric", id);
    }

    get rubrics(): IRubric[] {
        return this.$store.getters.rubrics;
    }
}
</script>
