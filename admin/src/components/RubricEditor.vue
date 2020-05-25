<template>
    <v-container>
        <v-form ref="form">
            <v-container fluid grid-list-md>
                <h1>Rubric Editor</h1>
                <h2 v-if="id">Editing mode</h2>                
                <v-layout row wrap>
                    <v-flex xs12>
                        <b-field label="Set the title of the rubric">
                            <v-text-field label="Rubric Name" v-model="currentRubric.name" outline :rules="[existenceRule]"/>
                        </b-field>
                    </v-flex>
                    <v-flex v-for="(setCriteria, index) in mountedCriteriasId" :key="index" class="criteria" xs12>
                        <v-card>
                            <v-card-title>
                                <b-field :label="`Choose Criteria ${index + 1}`"/>
                            </v-card-title>
                            <!-- Since we can't actually set the criteria directly, we assign it key-wise instead -->
                            <!-- Also note that the name would not change, meanining re-render logic isn't affected -->
                            <v-overflow-btn :items="criteriaDropDown" v-model="mountedCriteriasId[index]" :rules="[existenceRule, duplicateRule]" outline/>
                            <v-btn type="button" @click="deleteCriteria(index)">Remove Criteria</v-btn>
                        </v-card>
                    </v-flex>
                    <v-btn type="button" @click="appendRubric()">Add Criteria</v-btn>
                    <v-btn type="button" @click="sendRubric()">{{id ? "Edit Rubric" : "Create Rubric"}}</v-btn>
                </v-layout>
            </v-container>
        </v-form>
    </v-container>
</template>

<style scoped>
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { IRubric, ICriteria } from "../../../common/interfaces/ToClientData";
import { Utils } from "../../../common/js/Utils";
import { EventBus, EventList, SnackEvent, ModalEvent } from "../EventBus";

interface DropDownConfiguration {
  text: string;
  value: string;
}

@Component({})
export default class RubricEditor extends Vue {

    @Prop({ default: "" }) private id!: string;


    // Set the Rubric to a default value
    // Note that course will be set when mounted() is called
    private currentRubric: IRubric = {
        name: "Default Name",
        course: "Sample course",
        criterias: [],
    };

    private failedFetch: boolean = false;

    // It should be duly noted that the ordering of the criteria is done with maps into an array
    // this is because maps always guarantees a particular oder. Note that order doesn't really matter here
    private mountedCriteriasId: string[] = [];

    get criterias(): ICriteria[] {
        return this.$store.getters.criterias;
    }

    get criteriaDropDown(): DropDownConfiguration[] {
        return this.criterias.map((criteria) => {
            return {
                text: criteria.name ? criteria.name : "",
                value: criteria._id ? criteria._id : ""
            };
        });
    }

    get rubrics(): IRubric[] {
        return this.$store.getters.rubrics;
    }

    get course(): string {
        return this.$store.getters.course;
    }

    // Remember we can't use index as keys due to Vue re-rendering algorithm. Use internal index instead
    private appendRubric() {
        // Don't bother adding if we don't have a criteria to begin with
        if (this.criterias.length) {
            // Remember to notify Vue of object assignments
            this.mountedCriteriasId.push(this.criterias[0]._id!);
        }
    }

    private deleteCriteria(index: number) {
        this.mountedCriteriasId.splice(index, 1);
    }

    // We send the payload and then determine whether or not we update/create
    private sendRubric() {
        // Perform a basic error check based on the rules
        const valid = (this.$refs.form as any).validate();

        if (!valid) {
            const message: SnackEvent = {
                message: "Failed generate quiz. Check the form for any errors",
                error: true
            };
            EventBus.$emit(EventList.PUSH_SNACKBAR, message);
            return;
        } else {
            // Change the map into an array and send it over
            this.currentRubric.criterias = this.mountedCriteriasId;

            const message: ModalEvent = {
                message: `Are you sure to create/modify the rubric?`,
                title: `Creating/modifying a rubric`,
                fn: this.$store.dispatch,
                data: ["sendRubric", this.currentRubric]
            };
            EventBus.$emit(EventList.OPEN_MODAL, message);
        }
    }

    // Mounting is a matter of figuring out whether or not we have a Rubric
    private mounted() {
        // Fetch the Rubric if applicable
        if (this.id !== "") {
            const maybeRubric = this.rubrics.find((rubric) => {
                return rubric._id === this.id;
            });

            if (maybeRubric) {
                this.currentRubric = maybeRubric;
                this.mountedCriteriasId = this.currentRubric.criterias;
            } else {
                this.failedFetch = true;
            }
        } else {
            // Otherwise, only set the course
            this.currentRubric.course = this.course;
        }
    }

    /**
     * Rules here
     */
    get existenceRule() {
        return Utils.Rules.existenceRule;
    }

    // Checks to see if there is a duplicate criteria id
    get duplicateRule() {
        return ((id: string) => {
            const totalIds = this.mountedCriteriasId.reduce((count: number, criteriaId) => {
                if (criteriaId === id) {
                    count = count + 1;
                }
                return count;
            }, 0);
            return totalIds === 1 || "Duplicate criterias detected";
        });
    }
}
</script>
