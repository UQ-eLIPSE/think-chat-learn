<template>
    <div class="container">
        <h1 class>Criteria List</h1>
        <router-link tag="button" to="/criteriaEditor">Add Criteria</router-link>
        <div v-for="criteria in criterias" :key="criteria._id" class="criteria">
            <span><b>Criteria Name</b>: {{criteria.name}}</span>
            <br/>
            <span><b>Description:</b>{{criteria.description}}</span>
            <br/>
            <button type="button" @click="editCriteria(criteria._id)">Edit</button>
            <br/>
            <button type="button" @click="deleteCriteria(criteria._id)">Delete</button>
        </div>        
    </div>
</template>

<style scoped>
    .criteria {
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
import { ICriteria } from "../../../common/interfaces/ToClientData";
@Component({})
export default class CriteriaList extends Vue {
    private async editCriteria(id: string) {
        await this.$router.push("/criteriaEditor?c=" + id);
    }

    private async deleteCriteria(id: string) {
        await this.$store.dispatch("deleteCriteria", id);
    }

    get criterias(): ICriteria[] {
        return this.$store.getters.criterias;
    }
}
</script>
