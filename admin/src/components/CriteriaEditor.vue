<template>
    <div class="container">
        <h1 class="moochat-name">Criteria Editor</h1>
        <h2 v-if="currentCriteria._id">Editing mode</h2>
        <form>
            <span>Criteria Title:</span><input v-model="currentCriteria.name" type="text"/>
            <br/>
            <span>Criteria Description:</span>
            <br/><textarea v-model="currentCriteria.description" :rows="4" :cols="30"/>
            <br/>
            <button type="button" @click="sendCriteria()">{{currentCriteria._id ? "Edit Criteria" : "Create Criteria"}}</button>
        </form>
    </div>
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
        this.$store.dispatch("sendCriteria", this.currentCriteria);
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
}
</script>
