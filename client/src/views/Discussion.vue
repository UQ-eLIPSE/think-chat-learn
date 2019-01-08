<template>
  <div>
    <div class="magic">
      <div class="columns">
        <div class="column pane1">
          <h1>Discover the most appropriate response
            for <b>Question 1: What’s more amazing?</b></h1>
          <img src="https://s3.amazonaws.com/fp.strategy11.com/images/knowledgebase/graph_type-examples.png" /><br /><br />
          <p>Now read the following passage on the Logistic Equation, found in your textbook in Chapter 9, page 214 (Bowman’s Ecology 2nd Edition)</p><br />
          <p>“In some cases the growth of a population can be represented by an S-shaped curve. Such a population exhibits logistic growth, a pattern in which its abundance increases rapidly at first, then stabilises at a population size known as its carrying capacity. The growth rate of the population decreases as the population size nears carrying capacity because resources such as food, water or space begin to be short in supply.”</p>
        </div>
        <div class="column pane2">
          <h2>Group Responses</h2>
          <h3>Additional Information</h3>
          <p>Danish cheesecake jelly-o jelly-o. Toffee jelly beans sesame snaps tart icing fruitcake toffee toffee. Cheesecake tootsie roll jelly topping chupa chups danish gummi bears donut. Tootsie roll bonbon dragée bear claw pastry bonbon gingerbread. Ice cream sesame snaps powder caramels danish tiramisu. Pastry jujubes powder bonbon carrot cake pie oat cake tiramisu icing.</p>
          <br /><br />
          <button class="primary">Continue</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.magic {
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
      &.pane1 {
      }

      &.pane2 {
        background-color: #fafafa;
      }
    }
  }
}
</style>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({})
export default class Discussion extends Vue {}
</script>