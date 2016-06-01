/// <reference path="./moocchat-utilities.js" />

/**
 * MOOCchat: Constants
 * 
 * See ./moocchat.stages.js for stage constants and timings.
 */

//  START CONSTRAINTS
var ENTER_KEY_CODE = 13;
var SPACE_KEY_CODE = 32;
var TAB_KEY_CODE = 9;
var CHAR_CODE_A = 65;
var COOKIE_USERNAME = "moocchat_username";
var BLANK = "#blank#";
var FAKE_INPUT_BOX = "<span class='moocchat-question-template-blank'>&emsp;&emsp;&emsp;&emsp;&emsp;</span>";
var CHECK_IMG = "<img src='./img/check.svg' class='moocchat-check-image' />";
var NOT_EDITABLE = 0;
var EDITABLE = 1;
var LONG = 1;
var FORCED_BY_TIMER = false;
var SCROLL_SPEED = 300;
var EMPTY_STAR_SRC = './img/empty_star.svg';
var FULL_STAR_SRC = './img/full_star.svg';
var SINGLE_SIGN_ON = false; //False to show login screen

//  START CONSENT CONSTANTS
var CONSENT_NO_SELECTION = 0;
var CONSENT_ACCEPTED = 1;
var CONSENT_REJECTED = 2;
//  END CONSENT CONSTANTS

//  START TIME OUT CONSTANTS
var ONE_SECOND = 1000;
var SECONDS_PER_MINUTE = 60;

// Pulls URL parameter value to set the waiting time when forming groups
// moocchat-utilities.js -> gup()
var GROUP_TIME_OUT_SECONDS = gup("GROUP_TIME_OUT_SECONDS");
if (!GROUP_TIME_OUT_SECONDS) GROUP_TIME_OUT_SECONDS = .25 * SECONDS_PER_MINUTE;
//  END TIME OUT CONSTANTS

// START PAGE CONSTANTS
var PREVIEW_PAGE = "#preview-page";
var LOGIN_PAGE = "#login-page";
var CONSENT_PAGE = "#consent-page";
var WAIT_PAGE = "#wait-page";
var LEARNING_PAGE = "#learning-page";
var MAIN_TASK_PAGE = "#main-task-page";
var IDLE_PAGE = "#idle-page";
var POST_SURVEY_PAGE = "#post-survey-page";
var SUBMIT_HIT_PAGE = "#submit-hit-page";
var COMPLETED_PAGE = "#completed-page";
var ALREADY_DONE_PAGE = "#already-done-page";
var INVALID_LOGIN = "#login-invalid";
// END PAGE CONSTANTS

//  START EXPERIMENTAL CASE CONSTANTS
var DISCUSSION_LOW = "moocchat-discussion-low";
var DISCUSSION_HIGH = "moocchat-discussion-high";
//  END EXPERIMENTAL CASE CONSTANTS

var CHOICE_LABEL = "moocchat-choice";
var QUESTION_TEMPLATE_LABEL = "moocchat-question-template";
var PROMPT_LABEL = "moocchat-prompt";

//  START WAIT MESSAGE IN IDLE PAGE
var WAITING_FOR_MAIN_TASK_PAGE = "Your group task will start when other students are ready.<br />If there are no others available, you'll get an individual task.<br />If time runs out and you don't see quiz question, please <a onclick='pageReload()'>refresh</a> the page and start again.";
var WAITING_FOR_EXPLANATION = "Please wait until other students submit their responses.";
var WAITING_FOR_DISCUSSION = "You will join discussion when other students are ready.";
var WAITING_FOR_OTHERS = "Please wait until other students are ready.";

// String constants
var PROBING_QUESTION_INSTRUCTION_HEADING = "For the essay below, select among the five choices of A, B, C, D, or E.";
var PROBING_QUESTION_JUSTIFICATION_HEADING = "Submit your answer and justification before the timer runs out.";

var DISCUSS_ASSUMPTION_INSTRUCTION_HEADING_GROUP = "Other students' responses are shown below. Discuss these assumptions in order to prepare for a question shown on the next screen.";
var DISCUSS_ASSUMPTION_INSTRUCTION_HEADING_SINGLE = "On the right is a chatroom with only yourself in it. Use it to reflect on the assumptions and the meaning of the essay to prepare for a question on the next screen.";

var DISCUSS_INSTRUCTION_HEADING_GROUP = "Other students' responses to the question are shown below. Discuss these responses. You will be able to revise your response on the next screen.";
var DISCUSS_INSTRUCTION_HEADING_SINGLE = "On the right is a chatroom with only yourself in it. Use it to reflect on your response. You will be able to revise your response on the next screen.";
var DISCUSSION_CHATBOX_HEADING = "You may request to end the chat to proceed before the timer runs out.";

var PROBING_REVISE_INSTRUCTION_HEADING_GROUP = "Based on your discussion with other students, select your final response.";
var PROBING_REVISE_INSTRUCTION_HEADING_SINGLE = "Based on your reflection on the previous page, select your final response.";
var PROBING_REVISE_JUSTIFICATION_HEADING = "Submit your final answer and optionally revise your justification before the timer runs out.";

var EXPLANATION_INSTRUCTION_HEADING = "Check the correct answer and review the explanation of the question.";
var EXPLANATION_CORRECT_ANSWER_HEADING = "The correct answer and the explanation are shown below.";

var SUBMIT_BUTTON_TEXT = "Submit";
var END_CHAT_BUTTON_TEXT = "Request to End Chat";
var CANCEL_END_CHAT_BUTTON_TEXT = "Cancel the Request";

//  END CONSTANTS