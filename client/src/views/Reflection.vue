<template>
  <div class="reflection">
    <div class="columns">
      <div class="column pane1">
        <h1>Reflection of <b>Question 1: What’s more amazing?</b></h1>
        <img src="https://s3.amazonaws.com/fp.strategy11.com/images/knowledgebase/graph_type-examples.png" /><br /><br />
        <p>
          Now read the following passage on the Logistic Equation, found in your
          textbook in Chapter 9, page 214 (Bowman’s Ecology 2nd Edition)
        </p>
        <br />
        <p>
          “In some cases the growth of a population can be represented by an
          S-shaped curve. Such a population exhibits logistic growth, a pattern
          in which its abundance increases rapidly at first, then stabilises at
          a population size known as its carrying capacity. The growth rate of
          the population decreases as the population size nears carrying
          capacity because resources such as food, water or space begin to be
          short in supply.”
        </p>
      </div>
      <div class="column pane2">
        <form>
          <h2>Your Response</h2>
          <p>
            Cotton candy chocolate cake wafer wafer. Marzipan chocolate cake
            caramels danish. Pastry lemon drops candy jelly beans topping gummi
            bears toffee. Jujubes powder liquorice topping caramels. Muffin
            lemon drops biscuit jelly soufflé chocolate bar liquorice liquorice
            donut. Candy canes soufflé halvah topping cake tiramisu soufflé
            biscuit.
          </p>
          <p>&nbsp;</p>
          <p>
            <b>Has your thinking changed from your initial response and in what
              way?</b>
          </p>
          <b-field>
            <b-input
              type="textarea"
              minlength="10"
              maxlength="500"
              placeholder="My initial response has changed…"
            >
            </b-input>
          </b-field>
          <Confidence />
          <button class="primary">Submit</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

.reflection {
  height: 100%;

  h3 {
    display: inline-block;
    margin-right: 1em;
  }

  .columns {
    height: 100%;
    margin-bottom: 0;
    margin-left: 0;
    margin-right: 0;
    margin-top: 0;

    .column {
      padding: 2em 3em 3em 3em;

      &.pane2 {
        background-color: $secondaryBg;
      }
    }
  }
}
</style>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import Confidence from "../components/Confidence.vue";

@Component({
  components: {
    Confidence
  }
})
export default class Reflection extends Vue {}
</script>
