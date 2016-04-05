function QuizRoom(id, qn) {
  this.quizRoomID = id;
  this.questionNumber = qn;
  this.conditionAssigned = -1;
  this.members = new Array();
  this.peerGeneratedQuestions = [];
  this.promptResps = [];
  this.probAns = [];
  this.qnaSets = [];
  this.chatLog = {'assumption':[], 'probing':[]};
  this.currentChatLog = 'assumption';
  this.quitReq = 0;
  this.readyNum = 0;
}

QuizRoom.prototype.addMember = function(client) {
  if(!(client in this.members))
    this.members.push(client);
};

QuizRoom.prototype.appendChatLog = function(msg) {
  msg["timestamp"] = new Date().toISOString();
  this.chatLog[this.currentChatLog].push(msg);
};

module.exports = QuizRoom;
