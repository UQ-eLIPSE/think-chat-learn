<template>
  <v-app id="app">
    <h1>MoocChat Intermediate Page</h1>
    <div class="content-container">
      <router-view class="router-panel" />
    </div>    
  </v-app>
</template>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { getIdToken, getLoginResponse } from "../../common/js/front_end_auth";

@Component({})
export default class App extends Vue {
}
</script>
