<template>
</template>

<script lang="ts">

import { setIdToken } from "../utils/auth";
import {Vue, Component} from "vue-property-decorator";

@Component
export default class Login extends Vue {
    private created() {
        const q = this.$route.query.q;
        setIdToken(q as string);

        // Essentially redirects to the main page assuming login is correct
        this.$store.dispatch("login", q).then(() => {
          this.$router.push("/");
        });
    }
}

</script>
