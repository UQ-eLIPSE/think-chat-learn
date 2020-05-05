<template>
  <footer>
    <a href="https://uq.edu.au/">
      <img src="@/assets/images/uq-logo-white.png" alt="The University of Queensland" title="The University of Queensland" />
    </a>
    <a href="https://www.elipse.uq.edu.au/" class="ft-right">
      <img src="@/assets/images/elipse-logo.png" alt="eLIPSE" title="eLIPSE" />
    </a>
  </footer>
</template>

<style lang="scss" scoped>
footer {
  align-items: center;
  background-color: $uq;
  bottom: 0;
  display: flex;
  height: 75px;
  left: 0;
  padding: 0 3em;
  position: inherit;
  width: 100%;

  @media (min-width: 1685px) {
    position: fixed;
  }

  a {
    width: 9em;

    &:first-child {
      margin-right: 2em;
    }
    &:last-child {
      margin-left: auto;
      width: 8em;
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({})
export default class Footer extends Vue {}
</script>
