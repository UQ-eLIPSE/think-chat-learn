<template>
    <v-container>
        <h1 class="moocchat-name">Rubric List</h1>
        <router-link tag="button" class="primary" to="/rubricEditor">Add Rubric</router-link>
        <v-container fluid grid-list-md>
            <v-layout row wrap>
                <v-flex v-for="rubric in rubrics"
                    :key="rubric._id"
                    xs12>
                    <v-card>
                        <v-card-title><h3>Rubric Name: {{rubric.name}}</h3></v-card-title>
                        <div class="controls">
                            <v-btn type="button"
                                    class="primary"
                                    @click="editRubric(rubric._id)">Edit</v-btn>
                            <v-btn type="button"
                                    class="primary"
                                    @click="deleteRubric(rubric._id)">Delete</v-btn>
                        </div>
                    </v-card>
                </v-flex>
            </v-layout>
        </v-container>
    </v-container>
</template>

<style scoped>
</style>

<script lang="ts">
import {Vue, Component} from "vue-property-decorator";
import { IRubric } from "../../../common/interfaces/ToClientData";
import { EventBus, EventList, ModalEvent } from "../EventBus";

@Component({})
export default class RubricList extends Vue {

    private async editRubric(id: string) {
        await this.$router.push("/rubricEditor?r=" + id);
    }

    private async deleteRubric(id: string) {
        const payload: ModalEvent = {
            message: `Are you sure to delete rubric with ID: ${id}`,
            title: "Deleting a rubric",
            fn: this.$store.dispatch,
            data: ["deleteRubric", id]
        };
        EventBus.$emit(EventList.OPEN_MODAL, payload);          
    }

    get rubrics(): IRubric[] {
        return this.$store.getters.rubrics;
    }
}
</script>
