<template>
  <div>
    <div class="discussion">
      <div class="columns">
        <div class="column pane1">
          <h1>
            Discover the most appropriate response for
            <b>Question 1: What’s more amazing?</b>
          </h1>
          <img src="https://s3.amazonaws.com/fp.strategy11.com/images/knowledgebase/graph_type-examples.png" /><br /><br />
          <p>
            Now read the following passage on the Logistic Equation, found in
            your textbook in Chapter 9, page 214 (Bowman’s Ecology 2nd Edition)
          </p>
          <br />
          <p>
            “In some cases the growth of a population can be represented by an
            S-shaped curve. Such a population exhibits logistic growth, a
            pattern in which its abundance increases rapidly at first, then
            stabilises at a population size known as its carrying capacity. The
            growth rate of the population decreases as the population size nears
            carrying capacity because resources such as food, water or space
            begin to be short in supply.”
          </p>
        </div>
        <div class="column pane2">
          <h2>Group Responses</h2>
          <div class="response">Nelsons folly American Main Arr Sea Legs crow's nest hang the jib Spanish Main jib jury mast coffer. Snow spanker Barbary Coast scallywag cutlass lass clap of thunder draft six pounders crack Jennys tea cup. Pillage lugger bilge water square-rigged hulk bucko tack tackle gibbet Sink me.</div>
          <div class="response">Lanyard booty Brethren of the Coast stern bilged on her anchor weigh anchor barque reef sails holystone prow. Belaying pin tender ye long boat hearties reef sails driver avast pinnace fire ship. Gangway Arr execution dock nipperkin nipper no prey, no pay crow's nest Cat o'nine tails bring a spring upon her cable Jack Tar.</div>
          <div class="response">Me Buccaneer capstan lee lookout quarterdeck chase guns grog run a shot across the bow tack. Brigantine Jolly Roger bilge chandler gun black spot piracy Privateer topgallant black jack. Gun Admiral of the Black chandler Privateer league jib Sea Legs Brethren of the Coast sloop yawl.</div>
          <h3>Additional Information</h3>
          <p>
            Danish cheesecake jelly-o jelly-o. Toffee jelly beans sesame snaps
            tart icing fruitcake toffee toffee. Cheesecake tootsie roll jelly
            topping chupa chups danish gummi bears donut. Tootsie roll bonbon
            dragée bear claw pastry bonbon gingerbread. Ice cream sesame snaps
            powder caramels danish tiramisu. Pastry jujubes powder bonbon carrot
            cake pie oat cake tiramisu icing.
          </p>
          <br /><br />
          <button class="primary">Continue</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../css/variables.scss";

.discussion {
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

        .response {
          background-color: rgba(170, 170, 170, 0.15);
          border-radius: 5px;
          padding: 1em;
          margin-bottom: 1em;
        }
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
