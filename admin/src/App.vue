<template>
  <div id="app">
    <!-- TODO move this somewhere else -->
    <link rel="stylesheet" href="//cdn.materialdesignicons.com/2.5.94/css/materialdesignicons.min.css">
    <side-nav/>
    <router-view id="routerpanel"/>
  </div>
</template>

<style lang="scss" scoped>

#app {
    font-family: 'Robot-Light', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100vh;
    width: 100vw;
    overflow: hidden;

    display: flex;
    flex-direction: row;
    flex-wrap: no-wrap;
}
#routerpanel{
    overflow-y: scroll;
}
</style>

<script lang="ts">
import {Vue, Component} from "vue-property-decorator";
import SideNav from "./components/SideNav.vue";
@Component({
  components: {
    SideNav,
  },
})
export default class App extends Vue {

  private mounted() {
  }

}
</script>
