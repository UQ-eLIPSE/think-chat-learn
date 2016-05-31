/// <reference path="./moocchat.constants.js" />

/**
 * MOOCchat: Stages and timings
 */

// Stage ID constants
var READ_STAGE = 0;
var DISCUSS_ASSUMPTION_STAGE = 1;
var PROBING_QUESTION_STAGE = 2;         // The quiz, initial stage
var PROBING_EXPLANATION_STAGE = 3;
var EVALUATION_STAGE = 4;
var EVAL_EXPLANATION_STAGE = 5;         // Reveal of the answer after the quiz has been completed
var DISCUSS_PROBING_STAGE = 6;          // Quiz answer discussion 
var PROBING_REVISE_STAGE = 7;           // The quiz, revision stage

/**
 * Quiz timings for each stage/state, in seconds.
 * Array order must aligned with above set of stages
 */
var QUIZ_TIMINGS = [
    -1,     // READ_STAGE
    300,    // DISCUSS_ASSUMPTION_STAGE
    360,    // PROBING_QUESTION_STAGE
    90,     // PROBING_EXPLANATION_STAGE
    240,    // EVALUATION_STAGE
    90,     // EVAL_EXPLANATION_STAGE
    900,    // DISCUSS_PROBING_STAGE
    240     // PROBING_REVISE_STAGE
];

/** 
 * @param {number} stageId ID of the stage.
 * @return {number} Time in seconds to show the stage.
 */
function getStageSeconds(stageId) {
    return QUIZ_TIMINGS[stageId];
}