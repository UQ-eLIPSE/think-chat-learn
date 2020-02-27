<template>
    <v-container>
        <v-form ref="form">
            <v-container fluid grid-list-md>
                <h1 class="tcl-name">Criteria Editor</h1>
                <h2 v-if="currentCriteria._id">Editing mode</h2>
                <v-layout row wrap>
                    <v-flex xs12>
                        <b-field label="Set the title of the criteria">
                            <v-text-field label="Criteria Name" v-model="currentCriteria.name" outline :rules="[existenceRule]"/>
                        </b-field>
                    </v-flex>
                    <v-flex xs12>
                        <b-field label="Describe the criteria">
                            <v-textarea label="Criteria Description" v-model="currentCriteria.description" outline :rules="[existenceRule]"/>
                        </b-field>
                    </v-flex>                    
                    <v-btn type="button" @click="sendCriteria()">{{currentCriteria._id ? "Edit Criteria" : "Create Criteria"}}</v-btn>
                </v-layout>
            </v-container>
        </v-form>
    </v-container>
</template>

<style scoped>
    .container button:hover {
        background-color: #51247a;
        transition: background-color 1s ease-out;
    }
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { ICriteria } from "../../../common/interfaces/ToClientData";
import { EventBus, EventList, SnackEvent, ModalEvent } from "../EventBus";
import { Utils } from "../../../common/js/Utils";

@Component({})
export default class CriteriaEditor extends Vue {

    @Prop({ default: "" }) private id!: string;


    // Set the criteria to a default value
    // Note that course will be set when mounted() is called
    private currentCriteria: ICriteria = {
        name: "Default Name",
        description: "Default Description",
        course: "Sample course"
    };

    private failedFetch: boolean = false;
    
    get criterias(): ICriteria[] {
        return this.$store.getters.criterias;
    }

    get course(): string {
        return this.$store.getters.course;
    }

    // We send the payload and then determine whether or not we update/create
    private sendCriteria() {
        // Perform a basic error check based on the rules
        const valid = (this.$refs.form as any).validate();

        if (!valid) {
            const message: SnackEvent = {
                message: "Failed generate quiz. Check the form for any errors",
                error: true
            }
            EventBus.$emit(EventList.PUSH_SNACKBAR, message);
            return;
        } else {
            const message: ModalEvent = {
                message: `Are you sure to create/modify the criteria?`,
                title: `Creating/modifying a criteria`,
                fn: this.$store.dispatch,
                data: ["sendCriteria", this.currentCriteria]
            }
            EventBus.$emit(EventList.OPEN_MODAL, message);
        }
    }

    // Mounting is a matter of figuring out whether or not we have a criteria
    private mounted() {
        // Fetch the criteria if applicable
        if (this.id !== "") {
            const maybeCriteria = this.criterias.find((criteria) => {
                return criteria._id === this.id;
            });

            if (maybeCriteria) {
                this.currentCriteria = maybeCriteria;
            } else {
                this.failedFetch = true;
            }
        } else {
            // Otherwise, only set the course 
            this.currentCriteria.course = this.course;
        }
    }

    /**
     * Rules here
     */
    get existenceRule() {
        return Utils.Rules.existenceRule;
    }
}
</script>
