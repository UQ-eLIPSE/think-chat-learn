<template>
    <v-container>
        <h1 class="tcl-name">Criteria List</h1>
        <router-link tag="button" class="primary" to="/criteriaEditor">Add Criteria</router-link>
        <v-container fluid grid-list-md>
            <v-layout row wrap>
                <v-flex v-for="criteria in criterias"
                    :key="criteria._id"
                    xs12>
                    <v-card>
                        <v-card-title><h3>Criteria Name: {{criteria.name}}</h3></v-card-title>
                        <span class="criteria-description"><b>Description:</b>{{criteria.description}}</span>
                        <div class="controls">
                            <v-btn type="button"
                                    class="primary"
                                    @click="editCriteria(criteria._id)">Edit</v-btn>
                            <v-btn type="button"
                                    class="primary"
                                    @click="deleteCriteria(criteria._id)">Delete</v-btn>
                        </div>
                    </v-card>
                </v-flex>
            </v-layout>
        </v-container>
    </v-container>    
</template>

<style scoped>
    .criteria-description {
        margin: 16px;
    }
</style>

<script lang="ts">
import {Vue, Component} from "vue-property-decorator";
import { ICriteria } from "../../../common/interfaces/ToClientData";
import { EventBus, EventList, ModalEvent } from "../EventBus";

@Component({})
export default class CriteriaList extends Vue {
    private async editCriteria(id: string) {
        await this.$router.push("/criteriaEditor?c=" + id);
    }

    private async deleteCriteria(id: string) {
        const payload: ModalEvent = {
            message: `Are you sure to delete criteria with ID: ${id}`,
            title: "Deleting a criteria",
            fn: this.$store.dispatch,
            data: ["deleteCriteria", id]
        };
        EventBus.$emit(EventList.OPEN_MODAL, payload);          
    }

    get criterias(): ICriteria[] {
        return this.$store.getters.criterias;
    }
}
</script>
