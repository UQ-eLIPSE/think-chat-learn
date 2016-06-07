// TODO: Replace these with the global configuration
var CLIENT_STATE_IDLE = 100;
var NUM_CLIENTS_PER_QUIZ_ROOM = 3;

function Client(id, name, fir_c, fir_time,
                fin_c, fin_time, sg_q, sg_qt, qna, qnaT, qi) {
  this.socketID = id;
  this.username = name;
  this.firstChoices = fir_c;
  this.firstChoiceTimestamps = fir_time;
  this.finalChoices = fin_c;
  this.finalChoiceTimestamps = fin_time;
  this.studentGeneratedQuestions = sg_q;
  this.studentGeneratedQuestionTimestamps = sg_qt;
  this.promptResp = "";
  this.promptRespsTime = "";
  this.evaluationAnswer = -1;
  this.evaluationAnswerTime = "";
  this.qnaSet = qna;
  this.qnaSetTimestamps = qnaT;
  this.oldQuizIndexes = [];
  this.quizIndex = qi;       //  ARRAY INDEX FOR quizSet
  this.questionNumber = -1;  //  Hasn't started on first question yet
  this.probingQuestionAnswer = -1;
  this.probingQuestionAnswerTime = "";
  this.quizRoomID = "";
  this.discussionRoomID = "";
  this.clientState = CLIENT_STATE_IDLE;
  this.quizCounter = 0;
  this.screenName = "";
  this.probJustification = "";
  this.evalJustification = "";
  this.conditionAssigned = -1;
  this.grouped = false;
  this.groupSize = NUM_CLIENTS_PER_QUIZ_ROOM;
  
  /** Holds reference to the active socket in use */
  this.socket;
}

Client.prototype = {
    isProbingQuestionAnswerValid: function() {
        return this.probingQuestionAnswer >= 0;
    },
    
    /**
     * @param {Socket} socket
     * @return {this}
     */
    setSocket: function(socket) {
        this.socket = socket;
        return this;
    },
    
    /**
     * @return {Socket}
     */
    getSocket: function() {
        return this.socket;
    }
}

module.exports = Client;
