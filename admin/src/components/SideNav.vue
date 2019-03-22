<template>
    <div class="sidebar">
        <h1 class="moochat-name">MOOCchat</h1>
        <div class="course-name">{{ course }}</div>
        <!-- Add v-for later-->
        <ul>
            <router-link tag="li" to="/">Welcome</router-link>
            <router-link tag="li" to="/quizList">Quiz List</router-link>
            <router-link tag="li" to="/questionList">Question List</router-link>
            <router-link tag="a" to="/marking">Marking</router-link>
        </ul>
    </div>
</template>

<style scoped>
.sidebar {
  color: white;
  text-shadow: rgb(85, 85, 85) 0.05em 0.05em 0.05em;
  width: 18rem;
  font-size: 1.2rem;
  overflow-y: hidden;
  background: rgb(150, 85, 102);
}

.course-name {
  font-style: italic;
  margin: 1rem 2rem 1.5rem;
}

.moochat-name {
  line-height: 1;
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
