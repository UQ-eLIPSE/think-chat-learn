<template>
    <div class="sidebar">
        <h1 class="moochat-name">MOOCchat</h1>
        <div class="course-name">{{user ? user.username : "No User" }}</div>
        <div class="logo"/>
        <!-- Add v-for later-->
        <ul>
            <router-link tag="li" to="/">Welcome</router-link>
            <router-link tag="li" to="/initial-answer">Intial Answer</router-link>
            <router-link tag="li" to="/discussion">Discussion</router-link>
            <router-link tag="li" to="/reflection">Reflection</router-link>
            <router-link tag="li" to="/survey">Survey</router-link>
            <router-link tag="li" to="/finish">Finish</router-link>
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
    background: rgb(34, 85, 102);
}

.course-name {
    font-style: italic;
    margin: 1rem 2rem 1.5rem;
}

.moochat-name {
    line-height: 1;
    margin: 2rem 2rem 1rem;
}

.logo {
    position: absolute;
    width: 100%;
    height: 3rem;
    bottom: 1rem;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center center;
    background-image: url("../../public/uq-logo-white.png");
}

</style>

<script lang="ts">
import {Vue, Component} from "vue-property-decorator";
import { IUser } from "../../../common/interfaces/DBSchema";

@Component({})
export default class SideNav extends Vue {
    get user(): IUser | null {
        return this.$store.getters.user;
    }
}
</script>
