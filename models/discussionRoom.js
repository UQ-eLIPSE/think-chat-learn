function DiscussionRoom(id, qi, qn) {
  this.discussionRoomID = id;
  this.quizIndex = qi;
  this.questionNumber = qn;
  this.members = new Array();
  this.chatLog = {'assumption':[], 'probing':[]};
  this.currentChatLog = 'assumption';
  this.conditionAssigned = -1;
  this.groupScore = 0;
  this.quitReq = 0;
}

DiscussionRoom.prototype.addMember = function(client) {
  this.members.push(client);
};

DiscussionRoom.prototype.appendChatLog = function(msg) {
  msg["timestamp"] = new Date().toISOString();
  this.chatLog[this.currentChatLog].push(msg);
};

module.exports = DiscussionRoom;
