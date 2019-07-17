<template>
    <div class="sidebar">
        <h1 class="moochat-name">MOOCchat</h1>
        <div class="course-name">{{ course }}</div>
        <!-- Add v-for later-->
        <ul>
            <router-link tag="li" to="/">Welcome</router-link>
            <router-link tag="li" to="/marking">Marking</router-link>
            <!-- <router-link tag="li" to="/quizList">Quiz List</router-link> -->
            <li class="inactive">Quiz List (Coming soon)</li>
            <!-- <router-link tag="li" to="/questionList">Question List</router-link> -->
            <li class="inactive">Question List (Coming soon)</li>
            <router-link tag="li" to="/criteria">View Criteria List</router-link>
            <router-link tag="li" to="/rubric">View Rubric List</router-link>
        </ul>
    </div>
</template>

<style scoped>
.sidebar {
  padding-left: 1rem;
  color: white;
  /* text-shadow: rgb(85, 85, 85) 0.05em 0.05em 0.05em; */
  width: 18rem;
  min-height: 100vh;
  font-size: 1.2rem;
  overflow-y: hidden;
  background: #51247a;
}

li {
  cursor: pointer;
}

li.inactive {
  color: rgba(255, 255, 255, 0.5);
  cursor: default;
}
.course-name {
  font-style: italic;
  margin: 1rem 2rem 1.5rem;
}

.moochat-name {
  line-height: 1;
  color: white !important;
  margin: 2rem 2rem 1rem;
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
@Component({})
export default class SideNav extends Vue {

  get course() {
    return this.$store.state.Quiz.course || '';
  }

}
</script>
