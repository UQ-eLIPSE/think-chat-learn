<template>
  <div class="feedback">
    <template v-if="quizSession && quiz">
      <div class="row feedback-header">
        <div class="col quiz-info">
          <h2>{{quiz.title}}</h2>
          <span>{{ new Date(quizSession.startTime).toLocaleString() }}</span>
        </div>
        <div class="row overall-score">
          <h3>Overall Score</h3>
          <div class="score">{{ overallScoreString }}</div>
        </div>
      </div>
      <h3>Grades</h3>
      <table v-if="markRows && markRows.length" class="marks-table">
        <thead>
          <th>Criterion</th>
          <th></th>
          <th>Score</th>
          <th>Feedback</th>
        </thead>
        <tbody>
          <tr v-for="(markRow, i) in markRows" :key="`markRow-${i}`">
            <td>{{ markRow.criterionName }}</td>
            <td class="tooltip">
              <span class="icon-container">
                <font-awesome-icon icon="info-circle" />
              </span>
              <span class="tooltiptext">{{ markRow.criterionDescription }}</span>
            </td>
            <td>{{ markRow.score }}</td>
            <td>{{ markRow.feedback }}</td>
          </tr>
        </tbody>
      </table>
      
      <div v-else>
        <!-- Marks not available -->
        <h1 class="faded">- Grades not available -</h1>
      </div>


      <div class="general-feedback" v-if="marksObject && marksObject.feedback">
        <h4 >General Feedback</h4>
        <span>{{ marksObject.feedback }}</span>
      </div>
      
      
    </template>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import {
  IUser,
  IQuiz,
  IQuizSession,
  IUserSession,
} from "../../../common/interfaces/ToClientData";
import OverviewContainer from "../components/OverviewContainer.vue";
import * as IWSToClientData from "../../../common/interfaces/IWSToClientData";
import * as IWSToServerData from "../../../common/interfaces/IWSToServerData";
import { SocketState, TimerSettings } from "../interfaces";
import { WebsocketManager } from "../../../common/js/WebsocketManager";
import { WebsocketEvents } from "../../../common/js/WebsocketEvents";
import { EventBus } from "../EventBus";
import { EmitterEvents } from "../emitters";
import { PastQuizSession } from "../views/Landing.vue";
import { IRubric } from "../../../common/interfaces/ToClientData";
import {
  ICriteria,
  Mark,
  IRubricCriteria,
} from "../../../common/interfaces/DBSchema";
import API from "../../../common/js/DB_API";

@Component
export default class Feedback extends Vue {
  @Prop({ default: undefined, required: true })
  private quizSession!: PastQuizSession;
  private marksObject: Mark | null = null;
  private responses!: any;
  private rubric: IRubricCriteria | null = null;

  get quiz() {
    return this.quizSession && this.quizSession.quiz;
  }

  get overallScoreString() {
    if (
      this.quizSession &&
      this.quizSession.overallScore !== undefined &&
      this.quizSession.overallMaximumMarks
    ) {
      return `${this.quizSession.overallScore}/${this.quizSession.overallMaximumMarks}`;
    }

    return "-";
  }

  get markRows(): {
    criterionName: string;
    criterionDescription?: string;
    score: string;
    feedback?: string;
  }[] {
    console.log(
      this.marksObject!,
      this.rubric!
      //   this.rubric.criteria,
      //   this.marksObject.marks
    );
    if (
      !this.marksObject ||
      !this.rubric ||
      !this.rubric.criteria ||
      !this.marksObject.marks
    ) {
      console.log("Marks/Rubric/Criteria missing");
      return [];
    }
    const marks = this.marksObject.marks;

    return this.rubric.criteria.map((criterion) => {
      const assignedMark = marks.find(
        (mark) => mark.criteriaId === criterion._id
      );
      if (!assignedMark)
        return {
          criterionName: criterion.name || "-",
          criterionDescription: criterion.description || "-",
          score: "-",
          feedback: "-",
        };

      return {
        criterionName: criterion.name || "-",
        criterionDescription: criterion.description || "-",
        score: `${assignedMark.value || "-"}`,
        feedback: assignedMark.feedback || "-",
      };
    });
  }

  async fetchRubricWithCriteria(
    rubricId: string
  ): Promise<IRubricCriteria | null> {
    // TODO: Make network request

    try {
      const rubricWithCriteria = await API.request(
        API.GET,
        API.RUBRIC + `${rubricId}/criteria`,
        {},
        undefined
      );

      if(!rubricWithCriteria || !rubricWithCriteria.payload) return null;
      
      return rubricWithCriteria.payload;

      // return {
      //   name: "rubric",
      //   course: "ENGG1234",
      //   criteria: [
      //     {
      //       _id: "5f44b66a261ab5499566b72c",
      //       name: "evaluating",
      //       description: "How well one evaluates",
      //       course: "ENGG1234",
      //     },
      //     {
      //       _id: "5f44b66a261ab5499566b72d",
      //       name: "interpreting",
      //       description: "How well one interprets",
      //       course: "ENGG1234",
      //     },
      //     {
      //       _id: "5f44b66a261ab5499566b72e",
      //       name: "analysing",
      //       description: "How well one analyses",
      //       course: "ENGG1234",
      //     },
      //   ],
      // };
    } catch (e) {
      console.log('Rubric fetch error');
      return null;
    }
  }

  /**
   * Fetch marks for current quizSessionId
   */
  async fetchMarksForQuizSessionId(
    quizSessionId: string
  ): Promise<Mark | null> {
    // TODO: Make network request

    try {
      const marksResponse = await API.request(
        API.GET,
        API.MARKS + `student/quizSession/${quizSessionId}`,
        {},
        undefined
      );

      if(!marksResponse || !marksResponse.payload || !marksResponse.payload.length) throw new Error('Could not fetch marks for quiz session');
      
      return marksResponse.payload[0];
      return {
        _id: "5f460413c47d51831e7cac0d",
        quizSessionId: "5f4603d4c47d51831e7cac09",
        markerId: "5f44be6a0a18f3520fd76675",
        userId: "5f44be6a0a18f3520fd76675",
        username: "asedqweqeqwewqwenaewsqasqedweasd",
        markerUsername: "asedqweqeqwewqwenaewsqasqedweasd",
        timestamp: new Date("2020-08-26T06:41:23.359Z"),
        quizId: "5f44b6c0261ab5499566b738",
        marks: [
          {
            value: 2,
            criteriaId: "5f44b66a261ab5499566b72c",
            feedback:
              "This is some dummy text to be replaced by actual feedback. There was a good attempt at evaluating but there was something missing in your response.  There was a good attempt at evaluating but there was something missing in your response. However, There was a good attempt at evaluating but there was something missing in your response.",
          },
          {
            value: 3,
            criteriaId: "5f44b66a261ab5499566b72d",
            feedback:
              "This is some dummy text to be replaced by actual feedback. There was a good attempt at evaluating but there was something missing in your response.  There was a good attempt at evaluating but there was something missing in your response. However, There was a good attempt at evaluating but there was something missing in your response.",
          },
          {
            value: 4,
            criteriaId: "5f44b66a261ab5499566b72e",
            feedback:
              "This is some dummy text to be replaced by actual feedback. There was a good attempt at evaluating but there was something missing in your response.  There was a good attempt at evaluating but there was something missing in your response. However, There was a good attempt at evaluating but there was something missing in your response.",
          },
        ],
        feedback: "",
      };
    } catch (e) {
      console.error(e.message);
      return null;
    }
  }

  async mounted() {
    console.log("Feedback : mounted(): ", this.quizSession);
    if (
      this.quizSession &&
      this.quizSession._id &&
      this.quizSession.quiz &&
      this.quizSession.quiz.rubricId &&
      this.quizSession.overallScore
    ) {
      // get rubric with pre-loaded criteria
      // TODO: Make network requests
      const rubric:
        | IRubricCriteria
        | null = await this.fetchRubricWithCriteria(
        this.quizSession.quiz.rubricId
      );

      // Check if rubric exists in database AND marksObject have been assigned to user
      if (rubric) this.rubric = rubric;
      // get marksObject
      const marksObject = await this.fetchMarksForQuizSessionId(
        this.quizSession._id
      );

      if (marksObject) this.marksObject = marksObject;
    }
  }
}
</script>
<style lang="scss" scoped>
.score {
  display: flex;
  padding: 0.25rem;
  font-size: 0.8rem;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  background-color: rgba($uq, 0.15);
  align-items: center;
}

.overall-score {
  display: flex;
  align-items: center;
  > * {
    padding: 0.5rem;
  }
  h3 {
    margin: 0;
  }
}

.feedback-header {
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.row {
  display: flex;
}

.col {
  display: flex;
  flex-flow: column;
}

.marks-table {
  td,
  th {
    padding: 0.5rem;
    font-size: 0.9em;
  }

  th {
    color: $uq;
  }
}
/* Tooltip container */
.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black; /* If you want dots under the hoverable text */
}

/* Tooltip text */
.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: #555;
  color: #fff;
  text-align: center;
  padding: 5px 0;
  border-radius: 6px;

  /* Position the tooltip text */
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -60px;

  /* Fade in tooltip */
  opacity: 0;
  transition: opacity 0.3s;
}

/* Tooltip arrow */
.tooltip .tooltiptext::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #555 transparent transparent transparent;
}

/* Show the tooltip text when you mouse over the tooltip container */
.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}

.general-feedback {
  padding: 1rem 0.5rem;
  > h4 {
    color: $uq;
  }
}
</style>