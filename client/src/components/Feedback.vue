<template>
  <div class="feedback">
    <template v-if="quizSession && quiz">
      <div class="row row-wrap feedback-header">
        <div class="col quiz-info">
          <h2>{{quiz.title}}</h2>
          <span>{{ new Date(quizSession.startTime).toLocaleString() }}</span>
        </div>

        <div class="row overall-score">
          <h3>Overall Score</h3>
          <div class="score">{{ overallScoreString }}</div>
        </div>
      </div>
      <hr />
      <h3>Grading criteria</h3>
      <div class="flex-row justify-space-between">
        <table v-if="markRows && markRows.length" class="marks-table">
          <thead>
            <th>&nbsp;&nbsp;&nbsp;</th>
            <th>Criterion</th>
            <th>Score</th>
            <th>Feedback</th>
          </thead>
          <tbody>
            <tr v-for="(markRow, i) in markRows" :key="`markRow-${i}`">
              <td class="ht" v-if="markRow.criterionDescription && typeof markRow.criterionDescription === 'string' && markRow.criterionDescription.trim().length > 0">
                <span class="icon-container">
                  <font-awesome-icon icon="info-circle" />
                </span>

                <span class="tooltip">{{ markRow.criterionDescription }}</span>
              </td>
              <td v-else><span></span></td>
              <td>{{ markRow.criterionName }}</td>
              <td>{{ markRow.score }}/{{ quizCriterionMaxMarksString }}</td>
              <td>{{ markRow.feedback }}</td>
            </tr>
          </tbody>
        </table>

        <div v-else class="not-available">
          <!-- Marks not available -->
          <h3 class="faded">- Grades not available -</h3>
        </div>

        <div class="general-feedback" v-if="marksObject && marksObject.feedback">
          <div class="general-heading">General Feedback</div>
          <span>{{ marksObject.feedback }}</span>
        </div>
      </div>
    </template>
    <hr />

    <div v-if="quizSession && quiz" class="quiz-attempt">
      <h3>Your Quiz Session</h3>
      <div class="attempt-id row">
        <h3>Attempt ID</h3>
        <td class="ht">
          <span class="icon-container">
            <font-awesome-icon icon="info-circle" />
          </span>

          <span class="tooltip">
            If you need to discuss your
            <b>Think.Chat.Learn</b> session,
            <br />please provide this ID in your communications.
          </span>
        </td>
        {{ attemptId }}
      </div>
    </div>
    <QuizSessionViewer :quizSession="quizSession" />
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
import { IRubric } from "../../../common/interfaces/ToClientData";
import {
  ICriteria,
  Mark,
  IRubricCriteria,
  AttemptedQuizSessionData,
} from "../../../common/interfaces/DBSchema";
import API from "../../../common/js/DB_API";
import QuizSessionViewer from "./QuizSessionViewer.vue";

@Component({
  components: {
    QuizSessionViewer
  }
})
export default class Feedback extends Vue {
  @Prop({ default: undefined, required: true })
  private quizSession!: AttemptedQuizSessionData;
  private marksObject: Mark | null = null;
  private responses!: any;
  private rubric: IRubricCriteria | null = null;

  get attemptId() {
    if (this.quizSession && this.quizSession._id) {
      // Beautify ID by splitting into 4 segments for displaying
      const reg = this.quizSession._id.match(/.{1,4}/g);

      if (!reg) {
        return this.quizSession._id;
      }

      return reg.join(" ");
    }

    return "N/A";
  }
  get quiz() {
    return this.quizSession && this.quizSession.quiz;
  }

  get quizCriterionMaxMarksString(): string {
    return this.quiz &&
      this.quiz.markingConfiguration &&
      this.quiz.markingConfiguration.maximumMarks
      ? `${this.quiz.markingConfiguration.maximumMarks}`
      : "-";
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
    if (
      !this.marksObject ||
      !this.rubric ||
      !this.rubric.criteria ||
      !this.marksObject.marks
    ) {
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
    try {
      const rubricWithCriteria = await API.request(
        API.GET,
        API.RUBRIC + `${rubricId}/criteria`,
        {},
        undefined
      );

      if (!rubricWithCriteria || !rubricWithCriteria.payload) return null;

      return rubricWithCriteria.payload;
    } catch (e) {
      console.log("Rubric fetch error");
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

      if (
        !marksResponse ||
        !marksResponse.payload ||
        !marksResponse.payload.length
      )
        throw new Error("Could not fetch marks for quiz session");

      return marksResponse.payload[0];
    } catch (e) {
      console.error(e.message);
      return null;
    }
  }

  async mounted() {
    if (
      this.quizSession &&
      this.quizSession._id &&
      this.quizSession.quiz &&
      this.quizSession.quiz.rubricId &&
      this.quizSession.overallScore
    ) {
      // get rubric with pre-loaded criteria
      // TODO: Make network requests
      const rubric: IRubricCriteria | null = await this.fetchRubricWithCriteria(
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

.overall-score,
.attempt-id {
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
  margin-bottom: 1rem;
  padding-bottom: 0.25rem;
}

.feedback hr {
  width: 70%;
  margin-left: auto;
  margin-right: auto;
}

.feedback h3 {
  font-weight: bold;
}

.not-available {
  padding-top: 1rem;

  .faded {
    color: rgba(150, 150, 150, 0.5);
    font-style: italic;
  }
}

.row {
  display: flex;
}

.row-wrap {
  flex-wrap: wrap;
}

.col {
  display: flex;
  flex-flow: column;
}

.marks-table {
  width: 50%;
  margin: 1rem 0.5rem;
  border: 1px solid #cfcfcf;

  td,
  th {
    padding: 0.5rem;
    font-size: 0.9em;
  }

  th {
    color: #256;
    background-color: rgba(#256, 0.2);
  }

  td {
      border-bottom: 1px solid #cfcfcf;
  }

  @media screen and (max-width: 768px){
    width: fit-content;
  }
}

.general-feedback {
  padding: 1rem 0.5rem;
  font-size: 0.9em;
  text-align: justify;
  width: 45%;

  @media screen and (max-width: 768px){
    width: 100%;
  }

  > .general-heading {
    font-weight: bold;
    color: #256;
    padding: 0.25rem 0 0.75rem 0;
  }
}

/* Tooltip CSS */

.ht:hover {
  cursor: pointer;
  opacity: 0.8;
}

.ht:hover .tooltip {
  display: block;
}

.tooltip {
  display: none;
  background: rgba(1, 0, 0, 0.95);
  color: white;
  margin-left: 28px; /* moves the tooltip to the right */
  margin-top: 15px; /* moves it down */
  position: absolute;
  z-index: 1000;
  padding: 0.5rem;
  border: 0.01em transparent;
  border-radius: 2px;
}
</style>