<template>
  <div class="magic">
    <div class="columns">
      <div class="column pane1">
        <h1>Feedback</h1>
        <p>By completing this survey, you’ll be providing essential information that we’ll use to be
          able to improve the efficiency of MOOCchat.</p>

        <h2>General</h2>
        <p><b>Provide comments on MOOCchat and these questions</b></p>
        <b-field>
          <b-input
            type="textarea"
            minlength="10"
            maxlength="500"
            placeholder="I love MOOCchat, it makes learning fun!"
          >
          </b-input>
        </b-field>
        <div class="block">
          <p><b>This activity was:</b></p>
          <b-radio
            v-model="radio"
            native-value="Not enjoyable"
          >
            Not enjoyable
          </b-radio>
          <b-radio
            v-model="radio"
            native-value="Not fun"
          >
            Not fun
          </b-radio>
          <b-radio
            v-model="radio"
            native-value="Ok"
          >
            Ok
          </b-radio>
          <b-radio
            v-model="radio"
            native-value="Fun"
          >
            Fun
          </b-radio>
          <b-radio
            v-model="radio"
            native-value="Enjoyable"
          >
            Enjoyable
          </b-radio>
        </div>

        <div class="question">
          <h2>Understanding</h2>
          <p><b>After the chat, my level of understanding of the concepts discussed in this question is:</b></p>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="I do not understand the concepts"
            >
              I do not understand the concepts
            </b-radio>
          </div>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="I understand the concepts only a bit"
            >
              I understand the concepts only a bit
            </b-radio>
          </div>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="I somewhat understand the concepts"
            >
              I somewhat understand the concepts
            </b-radio>
          </div>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="I fully understand the concepts"
            >
              I fully understand the concepts
            </b-radio>
          </div>
        </div>
      </div>

      <div class="column pane2">
        <div class="question">
          <h2>Quality of Interaction</h2>
          <p><b>In this discussion:</b></p>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="I gave my own ideas but did not really consider others ideas"
            >
              I gave my own ideas but did not really consider others ideas
            </b-radio>
          </div>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="I considered others ideas but did not really state my own"
            >
              I considered others ideas but did not really state my own
            </b-radio>
          </div>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="I gave my own ideas and I considered others ideas"
            >
              I gave my own ideas and I considered others ideas
            </b-radio>
          </div>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="I persisted in trying to understand and discuss even when others disagreed or
wanted to give up"
            >
              I persisted in trying to understand and discuss even when others disagreed or
              wanted to give up
            </b-radio>
          </div>
        </div>

        <div class="question">
          <p><b>In the discussion, our group…</b></p>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="All stated their own ideas but with no real interaction"
            >
              All stated their own ideas but with no real interaction
            </b-radio>
          </div>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="Mostly just agreed with the person/s who seem to know the answer"
            >
              Mostly just agreed with the person/s who seem to know the answer
            </b-radio>
          </div>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="Discussed enough to get the correct answer but not to understand why"
            >
              Discussed enough to get the correct answer but not to understand why
            </b-radio>
          </div>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="Discussed ideas to gain some understanding"
            >
              Discussed ideas to gain some understanding
            </b-radio>
          </div>
          <div class="field">
            <b-radio
              v-model="radio"
              native-value="Debated ideas until all agreed and fully understood"
            >
              Debated ideas until all agreed and fully understood
            </b-radio>
          </div>
        </div>
        <button class="primary">Submit</button>
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
  .question {
    margin-bottom: 2em;
  }
  p {
    margin-bottom: 1em;
  }
}
</style>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({})
export default class Survey extends Vue {}
</script>