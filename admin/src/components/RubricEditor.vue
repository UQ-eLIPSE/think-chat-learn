<template>
    <div class="container">
        <h1 class="moochat-name">Rubric Editor</h1>
        <h2 v-if="id">Editing mode</h2>
        <form>
            <span>Rubric Title:</span><input v-model="currentRubric.name" type="text"/>
            <br/>
            <button type="button" @click="sendRubric()">{{id ? "Edit Rubric" : "Create Rubric"}}</button>
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
import { IRubric } from "../../../common/interfaces/ToClientData";
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
    
    get rubrics(): IRubric[] {
        return this.$store.getters.rubrics;
    }

    get course(): string {
        return this.$store.getters.course;
    }

    // We send the payload and then determine whether or not we update/create
    private sendRubric() {
        this.$store.dispatch("sendRubric", this.currentRubric);
    }

    // Mounting is a matter of figuring out whether or not we have a Rubric
    private mounted() {
        // Fetch the Rubric if applicable
        if (this.id !== "") {
            const maybeRubric = this.rubrics.find((Rubric) => {
                return Rubric._id === this.id;
            });

            if (maybeRubric) {
                this.currentRubric = maybeRubric;
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
