<template>
  <footer>
    <div class="columns is-vcentered">
      <div class="column is-vcentered">
        <a href="http://uq.edu.au/">
          <img
            src="../../public/uq-logo-white.png"
            alt="The University of Queensland"
            title="The University of Queensland"
          />
        </a>
      </div>
      <div class="column is-three-quarters" />
      <div class="column is-vcentered">
        <a href="https://www.elipse.uq.edu.au/">
          <img
            src="https://www.elipse.uq.edu.au/filething/get/74/h200-xlarge.png"
            alt="eLIPSE"
            title="eLIPSE"
          />
        </a>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

footer {
  background-color: $primary;
  width: 100%;
  padding: 1.5em 0;

  .columns {
    margin: 0 auto;
    max-width: 1970px;
  }

  a img {
    width: 10.625em;
    &:last-child {
      float: right;
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
