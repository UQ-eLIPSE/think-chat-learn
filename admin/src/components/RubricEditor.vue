<template>
    <div class="container">
        <h1 class="moochat-name">Rubric Editor</h1>
        <h2 v-if="id">Editing mode</h2>
        <form>
            <span>Rubric Title:</span><input v-model="currentRubric.name" type="text"/>
            <br/>
            <div v-for="(setCriteria, index) in mountedCriteriasId" :key="index" class="criteria">
                <span>Settings for Criteria {{index + 1}}</span>
                <!-- Since we can't actually set the criteria directly, we assign it key-wise instead -->
                <!-- Also note that the name would not change, meanining re-render logic isn't affected -->
                <select v-model="mountedCriteriasId[index]">
                    <option v-for="criteria in criterias" :key="criteria._id" :value="criteria._id">
                        {{criteria.name}}
                    </option>
                </select>
                <button type="button" @click="deleteCriteria(index)">Remove Criteria Criteria</button>
            </div>
            <button type="button" @click="appendRubric()">Add Criteria</button>
            <button type="button" @click="sendRubric()">{{id ? "Edit Rubric" : "Create Rubric"}}</button>
        </form>
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
import { Vue, Component, Prop } from "vue-property-decorator";
import { IRubric, ICriteria } from "../../../common/interfaces/ToClientData";

@Component({})
export default class RubricEditor extends Vue {

    @Prop({ default: "" }) private id!: string;


    // Set the Rubric to a default value
    // Note that course will be set when mounted() is called
    private currentRubric: IRubric = {
        name: "Default Name",
        course: "Sample course",
        criterias: []
    };

    private failedFetch: boolean = false;

    // It should be duly noted that the ordering of the criteria is done with maps into an array
    // this is because maps always guarantees a particular oder. Note that order doesn't really matter here
    private mountedCriteriasId: string[] = [];
    
    get criterias(): ICriteria[] {
        return this.$store.getters.criterias;
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
        // Change the map into an array
        this.currentRubric.criterias = this.mountedCriteriasId;
        this.$store.dispatch("sendRubric", this.currentRubric);
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
}
</script>
