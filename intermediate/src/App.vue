<template>
  <v-app id="app">
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
  private renderRestart = false;

  private restartSocket() {
  }
}
</script>
