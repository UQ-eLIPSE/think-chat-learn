/// <reference path="./moocchat.constants.js" />
/// <reference path="./moocchat.stages.js" />

// IE8 does not supply console object unless dev console is open
// See http://stackoverflow.com/questions/690251/what-happened-to-console-log-in-ie8
if (typeof console === "undefined" || typeof console.log === "undefined") {
  // Set up fake console object to prevent errors
  console = {};
  console.log = function() {};
}

//  START GLOBAL VARIABLES
var socket;
var username = "";
var isCookieSet = false;
var conditionAssigned = -1;
var conditionSet;
var quizRoomID = "";
var questionNumber = -5;
var stage = -1;
var conditionNames = [];
var stageName;
var currentPage = LOGIN_PAGE;
var quiz;
var moocchatChoicesClicked = [];
var peerQuestions = [];
var promptResp = "";
var promptResps = [];
var probAnswers = [];
var answersForPeerQuestions = [];
var qnaSets = [];
var userList = [];
var screenName = "";
var numMembers = -1;
var lastChat = new Date();
var wantToQuit = true;
var probingQuestionChoicesClicked = [-1];
var evaluationChoicesClicked = [-1];
var scrollPosition = 0;
var isChoicesClickable = true;
var finished = false;
var chatObj = {};
var paused = false;
var discussionRating = 0;

  //  START TIMERS
  var quizWaitTimer;
  var mainTimer;
  //  END TIMERS

  // URL parameters from Amazon Mechanical Turk
  var turkDebug = false; // Show all URL parameters on login/preview page
  var turkAssignmentId = decodeURIComponent(gup("assignmentId"));
  var runningInTurk = turkAssignmentId.length > 0;
  var turkHitId = decodeURIComponent(gup("hitId"));
  var turkWorkerId = decodeURIComponent(gup("workerId"));
  var turkTurkSubmitTo = decodeURIComponent(gup("turkSubmitTo"));
  var TURK_ASSIGNMENT_ID_NOT_AVAILABLE = "ASSIGNMENT_ID_NOT_AVAILABLE";
  // END URL parameters from Amazon Mechanical Turk

//  END GLOBAL VARIABLES

function isAssignedTo(condName) { return ($.inArray(condName, conditionNames)>=0); }

function replaceBlankWithInputBox(text, isEditable, idNum, isLong) {
  var res = text;

  while(res.indexOf(BLANK)>=0) {
    if(!isEditable) res = res.replace(BLANK, FAKE_INPUT_BOX);
    else {
      if(!isLong)
        res = res.replace(BLANK, "<input class='form-control input-sm editable-blank editable-blank-" + idNum + "' type='text'>");
      else
        res = res.replace(BLANK, "<input class='form-control input-sm editable-blank editable-blank-long editable-blank-" + idNum + "' type='text'>");
    }
  }
  return res;
}

function getMOOCchatTypeChoice(s, num, label) {
  var item = "<div id='" + label + "-" + num + "' class='list-group-item " + label + " " + label + "-" + num + "'>";
  var box = "<div id='" + label + "-" + num + "-box' class='moocchat-choice-box moocchat-choice-box-" + num + "'>" + String.fromCharCode(CHAR_CODE_A + num) + "</div>";
  var text = s;
  if(label==QUESTION_TEMPLATE_LABEL) {
    text = replaceBlankWithInputBox(text, NOT_EDITABLE);
  }
  var statement = "<h4 class='list-group-item-heading moocchat-choice-statement'>" + text + "</h4>";
  item += box + statement + "</div>";
  return $(item);
}

// function getStarRatingTool(num) {
//   var ratingTool = "<div class='star-rating' id='star-rating-" + num + "'>";
//   for(var j=1;j<=5;j++) {
//     ratingTool += "<img class='star' id='star-" + num + "-" + j + "' src='" + EMPTY_STAR_SRC + "' />";
//   }
//   ratingTool += "</div>";

//   return ratingTool;
// }

function setConditionNames(conditionNum) {
  var numIndepVars = objectLength(conditionSet);
  if(numIndepVars==1) {
    for(var indepVar in conditionSet) {
      conditionNames = [conditionSet[indepVar][conditionNum]];
    }
  }
  else {
    var indepVars = [];
    for(var indepVar in conditionSet) { indepVars.push(indepVar); }

    var combination = conditionSet[indepVars[0]];
    for(var i=1;i<indepVars.length;i++) {
      combination = getCombinations(combination, conditionSet[indepVars[i]]);
    }
    conditionNames = combination[conditionNum];
  }
}

function setStageName(sta) {
  stageName = "moocchat-main-task-stage-" + sta;
}

function connectionConfirmed(id) {
  socketID = id;
  console.log("[" + socketID + "] connectionConfirmed()");
}

function getConsentComplete(value) {
  if (value==CONSENT_ACCEPTED) {
    goToPage(IDLE_PAGE);
    console.log("CONSENT_ACCEPTED");
  } else if (value==CONSENT_REJECTED) {
    // location.replace('questions.html') //  TODO: where they are placed when rejected
    console.log("CONSENT_REJECTED");
  } else {
    console.log("CONSENT_NO_SELECTION");
    // showUI('checking_consent_panel', false);
    // showUI('consent_panel', true);
    $(CONSENT_PAGE + " #consent-checking-panel").toggleClass("hidden");
    $(CONSENT_PAGE + " #consent-panel").toggleClass("hidden");
  }
}

function setConsentComplete(value) {
  username = value.username;
  if (window.accept_value==CONSENT_ACCEPTED) {
    console.log("CONSENT_ACCEPTED");
	quizWaitlistReq({username:username});
    goToPage(IDLE_PAGE);
  } else if (window.accept_value==CONSENT_REJECTED) {
    // location.replace('questions.html') //  TODO: where they are placed when rejected

	quizWaitlistReq({username:username});

	goToPage(IDLE_PAGE);

	console.log("CONSENT_REJECTED");

  }
}





function getTimeComplete(timeStr) {
  // socket.emit('login_req', {username: username, password: "ischool"});

  // var timeServer = new Date(timeStr);
  // var timeLocal = new Date();
  // var timeDiffMs = timeLocal.getTime() - timeServer.getTime();
  // var timer = setInterval(function() {
  //   var date = new Date();
  //   date.setTime(date.getTime() - timeDiffMs);

  //   var h = date.getUTCHours();
  //   var m = date.getUTCMinutes();
  //   var s = date.getUTCSeconds();
  //   // console.log(h + ":" + m + ":" + s);

  //   var mRemaining = 0;
  //   var sRemaining = 60 - s;
  //   mRemaining = (Math.floor(m/MINUTES_BETWEEN_TRIALS)+1)*MINUTES_BETWEEN_TRIALS - m - 1;
  //   if(sRemaining >= 60) { sRemaining -= 60; mRemaining+=1; }

  //   // This "freezes" the timer at zero for 10 seconds or so,
  //   // allowing for missed events
  //   sRemaining -= 10;
  //   if(sRemaining < 0) { sRemaining += 60; mRemaining-=1; }
  //   if(mRemaining < 0) { sRemaining=mRemaining=0; }

  //   // testWorkerIds = ["A2X3ZSPAADO7P1", "A172XZJCUW07G6"];
  //   testWorkerIds = [];
  //   if (contains(testWorkerIds, gup('workerId'))) {
  //     mRemaining = 0;
  //     sRemaining = 0;
  //   }

  //   var timeRemaining = (mRemaining<10 ? "0"+mRemaining : mRemaining) + " : " + (sRemaining<10 ? "0"+sRemaining : sRemaining);
  //   replaceSpan("wait-page-timer", timeRemaining);

  //   if(mRemaining + sRemaining/60 < MINUTES_BETWEEN_TRIALS/7) {  //  SESSION START IMMINENT
  //     $(WAIT_PAGE + " #wait-timer-bar").toggleClass("navbar-inverse");
  //   }

  //   if(mRemaining == 0 && sRemaining == 0) {
  //     clearInterval(timer);
  //     // Redirect to main app
  //     // No need to URI encode, gup does not decode them in the first place
  //     // location.replace("./client.html?assignmentId=" + gup('assignmentId') + "&workerId=" + gup('workerId')  + "&hitId=" + gup('hitId') + "&turkSubmitTo=" + gup('turkSubmitTo'));
  //     if(username!="") {
  //       // alert("The interactive review session is now starting.");

  //       if (gup('stop') != "") {
  //         // Secret GET parameter to stop server - note, is not secure
  //         socket.emit('stop');
  //         return;
  //       }

  //       // assignmentId = gup('assignmentId');
  //       // if (assignmentId == "") {
  //       // Blank assignmentId means directly accessing URL for testing,
  //       socket.emit('login_req', {username: username, password: "ischool"});
  //       // } else {
  //       // 'ischool' password will create new user if needed
  //       //   socket.emit('login_req', {username: gup('workerId'), password: 'ischool'});
  //       // }

  //       goToPage(IDLE_PAGE);
  //     } else {
  //       alert("You couldn't join this session you have not signed in. Please sign in.");
  //       $.removeCookie(COOKIE_USERNAME, {path:"/"});
  //       goToPage(LOGIN_PAGE);
  //     }
  //   }
  // }, ONE_SECOND);
}

function loginExistingUser() {
  goToPage(ALREADY_DONE_PAGE);
}

function loginFailed(data) {
  //alert("Login failure: " + data + " - Restarting task. Please try again. Username should be 5 characters.");

  goToPage(INVALID_LOGIN);
}

function startTask(data) {
  username = data.username;
  if(data) {
    quiz = data.quiz;
  }
  else {
    console.log('ERROR: couldn\'t get quiz data');
    return;
  }

  quizWaitlistReq({username:username});
  stage = PROBING_QUESTION_STAGE;
  goToPage(IDLE_PAGE);

  //goToPage(CONSENT_PAGE);
}

function quizWaitlistReq(data) {  //  data:{username}
  console.log("[" + username + "] quizWaitlistReq()");
  // username = data.username;
  $(IDLE_PAGE + " #idle-message").html(WAITING_FOR_MAIN_TASK_PAGE);
  var timerEnd = getTimerEnd(GROUP_TIME_OUT_SECONDS);
  var groupTimeOut = secondsRemaining(timerEnd);
  $(IDLE_PAGE + " #idle-timer").html(getMinute(groupTimeOut)+' : '+getSecond(groupTimeOut));
  socket.emit('quizWaitlistReq', {username:username,  timestamp:new Date().toISOString()});

  quizWaitTimer = setInterval(function() {
    groupTimeOut = secondsRemaining(timerEnd);
    $(IDLE_PAGE + " #idle-timer").html(getMinute(groupTimeOut)+' : '+getSecond(groupTimeOut));
    if(groupTimeOut==0) {
      $(IDLE_PAGE + " #idle-timer").html("00 : 00");
      console.log("group timeout");
      socket.emit('quizWaitlistForceProceed', {username:username});
    }
  }, ONE_SECOND / 2);     // Interval changed to half a second to avoid
                          // issue #57 (occasional decrement by 2) due
                          // to JS timer variability
}

function comeBackLater(data) {  //  data:{username}
  alert("No other students are available at the current time to group with you. Please try again in a future session.");
  $.removeCookie(COOKIE_USERNAME, {path:"/"});
  goToPage(LOGIN_PAGE);
}

function updateQuizWaitlistReq(data) {  //  data:{username, quizRoomID, questionNumber, conditionAssigned, conditionSet, numMembers}
  quizRoomID = data.quizRoomID;
  questionNumber = data.questionNumber;
  numMembers = data.numMembers;
  conditionAssigned = data.conditionAssigned;
  conditionSet = data.conditionSet;

  console.log("[" + username + "] updateQuizWaitlistReq() - quizRoomID: " + quizRoomID);
  socket.emit('updateQuizWaitlistReq', {username:username, quizRoomID:quizRoomID});
}

function joinQuizRoomReq(data) { //  data:{username, quizRoomID}
  console.log("[" + username + "] joinQuizRoomReq() - quizRoomID: " + quizRoomID);
  socket.emit('joinQuizRoomReq', data);
}

function quizReq(data) { //  data:{username, quizRoomID}
  console.log("[" + username + "] quizReq() - quizRoomID: " + quizRoomID);
  socket.emit('quizReq', data);
  socket.emit("finishedReading", {username:username, quizRoomID:quizRoomID, promptResp:promptResp});
}

function startQuiz(data) { //  data:{username, quizRoomID, quiz);
  console.log("[" + username + "] startQuiz() - quizRoomID: " + quizRoomID);
  clearInterval(quizWaitTimer);
  // quiz = data.quiz;
  var maxChoices = quiz['maxChoiceForStudentGenerateQuestion'];
  for(var i=0;i<maxChoices;i++) {
    moocchatChoicesClicked.push(-1);
  }
  // goToPage(MAIN_TASK_PAGE);
}

function startDiscussProbing() {
  stage = DISCUSS_PROBING_STAGE;
  goToPage(MAIN_TASK_PAGE);
  console.log('417');
}

function startExplanation() {
  stage = PROBING_EXPLANATION_STAGE;
  goToPage(MAIN_TASK_PAGE);
}

function goToPage(pageID) {
	var timeSpent = stopWatch();
	//console.log(timeSpent);
	ga('send','event',pageID,timeSpent);

  $('.moocchat-page').addClass('hidden'); //  HIDE ALL THE CONDITIONAL ELEMENTS
  currentPage = pageID;
  $(currentPage).removeClass('hidden'); //  SHOW THE CURRENT CONDITIONAL ELEMENTS
  window.location.replace(currentPage);
  restartClock();
  updatePage(currentPage);
}

function resetStage(condNum, sta, substa) {
  $(".moocchat-conditional").addClass("hidden"); //  HIDE ALL THE CONDITIONAL ELEMENTS
  setConditionNames(condNum);
  setStageName(sta, substa);
  enableNextButton(false);
}

function enableNextButton(isOn) {
  if(isOn)
    $(".moocchat-next-button").removeClass("disabled");
  else
    $(".moocchat-next-button").addClass("disabled");
}

// function receivePeerQuestions(data) {  //  data: [ {username, studentGeneratedQuestions}, ...]
//   peerQuestions = data;
//   console.log(peerQuestions);
//   goToPage(MAIN_TASK_PAGE);
// }

// function receiveQNAs(data) {  //  data: [ {question, answer}, ...]
//   qnaSets = data;
//   console.log(qnaSets);
//   socket.emit("userListReq", {username:username, quizRoomID:quizRoomID});
// }

function receivePromptResp(data) {  //  data: [{username, promptResp}, ...}]
  promptResps = data;
  console.log(promptResps);
  socket.emit("userListReq", {username:username, quizRoomID:quizRoomID});
}

function receiveUserList(data) {  //  data: [ {username, screenName}, ...]
  userList = data;
  console.log(userList);
  for(var i=0;i<userList.length;i++) {
    var user = userList[i];
    if(user["username"]==username) {
      screenName = user["screenName"];
    }
  }
  goToPage(MAIN_TASK_PAGE);
}

function receiveProbAnswers(data) { //  data : [{username, screenName, answer}, ...]
   probAnswers = data;
   console.log(probAnswers);

   stage = DISCUSS_PROBING_STAGE;
   goToPage(MAIN_TASK_PAGE);
}

// From http://stackoverflow.com/a/7124052/724491
function htmlEscape(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

function showIncomingMessage(data) { //  data {username, quizRoomID, screenName, message}
  var screenNameSlug = getSlug(data.screenName);
  var blockstart = "<blockquote class='moocchat-message " + screenNameSlug + "'>";
  var sn;
  if(data.screenName==screenName) sn = "Me";
  else if(data.screenName=="system") sn = "";
  else sn = data.screenName;

  if(sn=="")
    var msg = "<p>" + htmlEscape(data.message) + "</p>";
  else
    var msg = "<p>" + sn + " : " + htmlEscape(data.message) + "</p>";

  var blockend = "</blockquote>";

  $(".moocchat-chat").append(blockstart + msg + blockend);
  $(".moocchat-chat").scrollTop(scrollPosition);
  scrollPosition += SCROLL_SPEED;

  lastChat = new Date();
}

function requestToQuitUpdated(data) { //  data {screenName, wantToQuit, numMembers, quitReq}
  if(data.numMembers!=numMembers) numMembers = data.numMembers;

  if(typeof data.wantToQuit === 'undefined') {
    //  FORCE QUIT TO SKIP DISCUSSION STAGE
  }
  else if(data.wantToQuit) {
    showIncomingMessage({username:"system", quizRoomID:quizRoomID, screenName:"system", message:data.screenName + " requested to end the discussion. You may end the discussion if all the members make the request. (" + data.quitReq + "/" + data.numMembers + ")."});
  }
  else {
    showIncomingMessage({username:"system", quizRoomID:quizRoomID, screenName:"system", message:data.screenName + " canceled the request. You may end the discussion if all the members make the request. (" + data.quitReq + "/" + data.numMembers + ")."});
  }

  if(numMembers<=data.quitReq) {

    //  QUIT DISCUSSION AND PROCEED TO PROBING QUESTION STAGE
    if(typeof data.wantToQuit !== 'undefined') chatObj = $(".moocchat-chat-area .moocchat-chat");

    if (stage == DISCUSS_ASSUMPTION_STAGE) {
      stage = PROBING_QUESTION_STAGE;
    }
    else if (stage == DISCUSS_PROBING_STAGE) {
      stage = PROBING_REVISE_STAGE;
    }
    updatePage(MAIN_TASK_PAGE);
  }
}

function postDiscussionStart() {
  goToPage(MAIN_TASK_PAGE);
}

function addBlankChecker(classSelector) {
  $(classSelector).keyup(function(e) {
    var blanks = $(classSelector);
    for(var i=0;i<blanks.length;i++) {
      if($(blanks[i]).val().length==0) {
        enableNextButton(false);
        return;
      }
    }
    enableNextButton(true);
  });
}

function setMainTimer(stage) {
	console.log("stage:"+ stage);
  //  RESET THE MAIN TIMER
  clearInterval(mainTimer);
  $(".main-task-timer").removeClass("btn-primary");

  //  DECIDE HOW LONG THE STAGE LASTS
    var stageDuration = getStageSeconds(stage);
 // un-comment line below, if you wish to get time settings from database, you can set timer for individual questions in DB
  //var stageDuration = quiz["stageDurations"][stage];
	console.log("duration:" + stageDuration);
  mainTimer = setInterval(function() {
    var minutes = Math.floor(stageDuration/60);
    var seconds = stageDuration % 60;

    var timeRemaining = (minutes<10 ? "0"+minutes : minutes) + " : " + (seconds<10 ? "0"+seconds : seconds);

    if(stageDuration>=0 && currentPage==MAIN_TASK_PAGE)  //  DOING THE TASK
      $("#main-task-timer-time").html(timeRemaining);
    else if(stageDuration>=0 && currentPage==IDLE_PAGE)  //  WATING FOR OTHERS
      $("#idle-timer").html(timeRemaining);

    if(stageDuration<=30 && stageDuration>=0 && currentPage==MAIN_TASK_PAGE) { //  END OF STAGE IMMINENT
      $(".main-task-timer").toggleClass("btn-primary");
    }

    if(stageDuration==0) { //  TIMER RAN OUT

      switch(stage) {
        case READ_STAGE:

          if(currentPage==MAIN_TASK_PAGE) {
            enableNextButton(true);
			socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Main Task Page', event:'Time Ran Out - Read Stage' });
            $(".moocchat-next-button").click();
          }
          else if(currentPage==IDLE_PAGE) {
            //  NOTE THAT stage MAY HAVE UNEXPECTED VALUE (OF PREVIOUS STAGE) IN THIS else if BLOCK
			socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Idle Page', event:'Time Ran Out - Read Stage' });
            socket.emit('proceedAfterMemberDropsReq', {username:username, quizRoomID:quizRoomID, stage:stage, timestamp:new Date().toISOString()});
          }

          break;

        case DISCUSS_ASSUMPTION_STAGE:
        case DISCUSS_PROBING_STAGE:

          if(wantToQuit) {
			socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Main Task Page', event:'Time Ran Out - Request to Cancel Chat' });
			$(".moocchat-next-button").click();

		  }

          break;

        case PROBING_QUESTION_STAGE:
        case PROBING_REVISE_STAGE:

          socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Question Stage/Revise Stage', event:'Time Ran Out' });
          enableNextButton(true);
          $(".moocchat-next-button").click();

          break;

        case PROBING_EXPLANATION_STAGE:
        case EVAL_EXPLANATION_STAGE:
		  socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Probing Explanation Stage', event:'Time Ran Out' });
          enableNextButton(true);
          $(".moocchat-next-button").click();

          break;

        case EVALUATION_STAGE:
		  socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Evaluation Stage', event:'Time Ran Out' });
          enableNextButton(true);
          $(".moocchat-next-button").click();

          break;

        default:
          console.log("UNDEFINED CONDITION DETECTED IN SETTING A TIMER");
          break;
      }
    }
    else {
      if(!paused) stageDuration--;
    }

  }, 1000);
}

function renderStage(cNames, sName) {

  //  MAKE THE NECESSARY (FOR THE CONDITION AND STAGE) ELEMENTS VISIBLE
  for(var i=0;i<cNames.length;i++) {
    var conditionAndStage = "." + cNames[i] + "." + sName;
    $(conditionAndStage).removeClass("hidden");
    console.log(conditionAndStage + " is on.");
  }

  switch(stage) {
    case READ_STAGE:
      // if(isAssignedTo(PROMPT_LOW)) {
      //   $(".moocchat-left-panel-direction").html("Read the short essay below.");
      //   $(".moocchat-right-panel-direction").html("When you finish reading, click on the 'Next' button before the timer runs out.");
      //   enableNextButton(true);
      //   //  NOT SO MUCH TO DO HERE
      // }
      // else if(isAssignedTo(PROMPT_HIGH)) {
      //   $(".moocchat-left-panel-direction").html("Read the short essay below.");
      //   $(".moocchat-right-panel-direction").html("When you finish reading and evaluating the passage, click on the 'Next' button before the timer runs out.");

      //   //  SHOW PROMPTS
      //   $('.moocchat-post-reading-direction').html("What is the most relevant evaluation of the essay?");
      //   $(".moocchat-prompt-choice-area").append("<div class='list-group moocchat-prompt-choice'></div>");
      //   for(var i=0;i<quiz["promptStatements"].length;i++) {
      //     var prompt = getMOOCchatTypeChoice(quiz["promptStatements"][i], i, PROMPT_LABEL);
      //     $(".moocchat-prompt-choice").append(prompt);

      //     //  ADD CLICK EVENT LISTENER
      //     prompt.click(function(e) {
      //       var clickedNum = parseInt($(this).attr("id").split("-").pop());
      //       if($.inArray(clickedNum, moocchatChoicesClicked)>=0) {  // CANCEL A CHOICE
      //         var index = moocchatChoicesClicked.indexOf(clickedNum);
      //         moocchatChoicesClicked[index] = -1;
      //         $(this).removeClass("selected");
      //         $(this).children(".moocchat-choice-box").html(String.fromCharCode(CHAR_CODE_A + clickedNum));
      //         $(".moocchat-prompt-answer-area .moocchat-prompt-"+clickedNum).remove();
      //       }
      //       else {  //  INITIAL CHOICE OR CHANGE CHOICE
      //         var index = moocchatChoicesClicked.indexOf(-1);
      //         if(index<0) {
      //           //  NO VACANCY
      //         }
      //         else {
      //           moocchatChoicesClicked[index] = clickedNum;
      //           $(this).addClass("selected");
      //           $(this).children(".moocchat-choice-box").html(CHECK_IMG);

      //           //  UPDATE RIGHT PANEL ACCORDING TO THE CHOICES
      //           var promptQuestion = quiz["promptQuestions"][clickedNum];
      //           // template = replaceBlankWithInputBox(template, EDITABLE, clickedNum);

      //           var answerable = "<div class='moocchat-prompt-" + clickedNum + " selected'>" + promptQuestion + "<br />";
      //           answerable += replaceBlankWithInputBox(BLANK, EDITABLE, clickedNum, LONG);
      //           answerable += "</div>";

      //           $(".moocchat-prompt-answer-area").append($(answerable));
      //           addBlankChecker(".moocchat-prompt-answer-area .editable-blank");
      //         }
      //       }

      //       //  CHECK THE CLICKED VALUES
      //       // for(var j=0;j<moocchatChoicesClicked.length;j++) { console.log(moocchatChoicesClicked[j]); }
      //     });
      //   }
      // }
      // else {
      //   console.log("UNDEFINED CONDITION DETECTED IN RENDERING A STAGE");
      // }

      // //  IN COMMON
      // $(".moocchat-reading").html(quiz["reading"]);
      // setMainTimer(stage);
      // enableNextButton(true);
      // $(".moocchat-next-button").click();

      break;

    case DISCUSS_ASSUMPTION_STAGE:
        wantToQuit = true;
        if(numMembers>1) {  //  GROUPED
          $(".moocchat-left-panel-direction").html(DISCUSS_ASSUMPTION_INSTRUCTION_HEADING_GROUP);
          $(".moocchat-right-panel-direction").html(DISCUSSION_CHATBOX_HEADING);
        }
        else {  //  SINGLETON
          $(".moocchat-left-panel-direction").html(DISCUSS_ASSUMPTION_INSTRUCTION_HEADING_SINGLE);
          $(".moocchat-right-panel-direction").html(DISCUSSION_CHATBOX_HEADING);
        }

        //  IN COMMON
        setMainTimer(stage);
        $(".moocchat-reading").html(quiz["reading"]);

        //  SHOW SHARED EVALUATION
        $('.moocchat-post-reading-direction').html("");
        var shared = "<div class='list-group'>";
        for(var i=0;i<promptResps.length;i++) {
          shared += "<div class='list-group-item'>";
          var resp = promptResps[i]["promptResp"];
          var un = promptResps[i]["username"];
          var sn = "";

          for(var j=0;j<userList.length;j++) {
            if(userList[j]["username"]==un) {
              sn = userList[j]["screenName"];
              break;
            }
            else {
              continue;
            }
          }

          shared += "<h4 class='list-group-item-heading'>" + "<span class='" + getSlug(sn) + "'>" + sn + "</span>" + " responded '" + resp + "'</h4>";
          // shared += "<p class='list-group-item-text'>" + promptResps[i]["promptResp"]["promptAnswer"] + "</p>";
          shared += "</div>";
        }

        $(".moocchat-prompt-share-area").html("");
        $(".moocchat-prompt-share-area").append(shared);

        //  CHANGE NEXT BUTTON INTO REQUEST TO QUIT BUTTON
        $(".moocchat-next-button").html(END_CHAT_BUTTON_TEXT);
        enableNextButton(true);
        $(".moocchat-next-button").removeClass("btn-info");
        $(".moocchat-next-button").addClass("btn-danger");

        //  CHAT BOX, TEXT INPUT, AND SEND BUTTON
        var chatDiv = "<div class='moocchat-chat'>";
        chatDiv += "</div>";
        chatDiv += "<input class='form-control' id='moocchat-chat-input' name='moocchat-chat-input' type='text' placeholder='Type message here.' autocomplete='off' />&nbsp;";
        chatDiv += "<button id='moocchat-chat-send' type='button' class='btn btn-warning'>Send</button>";
        if($(".moocchat-chat-area").children().length==0) $(".moocchat-chat-area").append(chatDiv);
        // else alert("why?");

        //  EVENT LISTENER FOR CHAT
        // $("#moocchat-chat-send").click(function() {
        //   var message = $("#moocchat-chat-input").val();
        //   if(message.length==0) return;
        //   var msg = {username:username, quizRoomID:quizRoomID, screenName:screenName, message:message};
        //   socket.emit("chatMessage", msg);
        //   $("#moocchat-chat-input").val("");
        //   $("#moocchat-chat-input").focus();
        // });

        $("#moocchat-chat-input").keydown(function(e) {
          if(e.which==TAB_KEY_CODE) {
            $("#moocchat-chat-send").focus();
            e.stopPropagation();
          }
          if(e.which==ENTER_KEY_CODE) $("#moocchat-chat-send").click();
        });

        $("#moocchat-chat-send").keydown(function(e) {
          if(e.which==TAB_KEY_CODE) {
            $("#moocchat-chat-input").focus();
            e.stopPropagation();
          }
          if(e.which==ENTER_KEY_CODE) $("#moocchat-chat-send").click();
        });

        //  SHOW WELCOME MESSAGE
        for(var i=0;i<promptResps.length;i++) {
          var un = promptResps[i]["username"];
          var sn = "";

          for(var j=0;j<userList.length;j++) {
            if(userList[j]["username"]==un) {
              sn = userList[j]["screenName"];
              break;
            }
            else {
              continue;
            }
          }
          if(username==un) {
            showIncomingMessage({username:"system", quizRoomID:quizRoomID, screenName:"system", message:"You joined discussion as " + sn + "."});
          }
          else {
            showIncomingMessage({username:"system", quizRoomID:quizRoomID, screenName:"system", message:sn + " joined discussion."});
          }
        }

        $("#moocchat-chat-input").focus();
      // }

      break;

    case PROBING_QUESTION_STAGE:

      //  IN COMMON
      setMainTimer(stage);

      $(".moocchat-left-panel-direction").html(PROBING_QUESTION_INSTRUCTION_HEADING);
      $(".moocchat-right-panel-direction").html(PROBING_QUESTION_JUSTIFICATION_HEADING);

      $(".moocchat-next-button").html(SUBMIT_BUTTON_TEXT);
      $(".moocchat-next-button").removeClass("btn-danger");
      $(".moocchat-next-button").addClass("btn-info");
      enableNextButton(false);

      //  SHOW PROBING QUESTION
      var reading = quiz["reading"];
      var probingQuestion = quiz["probingQuestion"];
      var choices = quiz["probingQuestionChoices"];
      $(".moocchat-reading").html(reading);
      $(".moocchat-post-reading-direction").html(probingQuestion);
      isChoicesClickable = true;

      //  SHOW CHOICES
      $(".moocchat-choice-area").html("<div class='list-group moocchat-probing-question-choice'></div>");
      $(".moocchat-justification-area").html("");
      // $(".moocchat-probing-question-choice").removeClass("disabled");

      //  ADD CLICK EVENT LISTENER
      for(var i=0;i<choices.length;i++) {
        var c = getMOOCchatTypeChoice(choices[i], i, CHOICE_LABEL);
        $(".moocchat-probing-question-choice").append(c);

        c.click(function(e) {
          if(!isChoicesClickable) return;
          var clickedNum = parseInt($(this).attr("id").split("-").pop());
          if($.inArray(clickedNum, probingQuestionChoicesClicked)>=0) {  // CANCEL A CHOICE
            var index = probingQuestionChoicesClicked.indexOf(clickedNum);
            probingQuestionChoicesClicked[index] = -1;
            $(this).removeClass("selected");
            $(this).children(".moocchat-choice-box").html(String.fromCharCode(CHAR_CODE_A + clickedNum));
            if (stage != DISCUSS_PROBING_STAGE) { enableNextButton(false); }
            $(".moocchat-justification-area").html("");
          }
          else {  //  INITIAL CHOICE OR CHANGE CHOICE
            var index = probingQuestionChoicesClicked.indexOf(-1);

            if(index<0) { // NO VACANCY
              var past = probingQuestionChoicesClicked[0];
              probingQuestionChoicesClicked[0] = clickedNum;

              $(".moocchat-choice-" + past).removeClass("selected");
              $(".moocchat-choice-" + past).children(".moocchat-choice-box").html(String.fromCharCode(CHAR_CODE_A + past));

              $(".moocchat-choice-" + clickedNum).addClass("selected");
              $(".moocchat-choice-" + clickedNum).children(".moocchat-choice-box").html(CHECK_IMG);
			  //socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Main Task Page', event:'Answer changed to: ' +  clickedNum});
              if (stage != DISCUSS_PROBING_STAGE) { enableNextButton(false); }
            }
            else {
              probingQuestionChoicesClicked[index] = clickedNum;
              $(this).addClass("selected");
              $(this).children(".moocchat-choice-box").html(CHECK_IMG);
              $(".moocchat-justification-area").html("");
              $('.moocchat-justification-blank').val("");
              //socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Main Task Page', event:'First Answer Selected: ' +  clickedNum});
			  if (stage != DISCUSS_PROBING_STAGE) { enableNextButton(false); }

            }

            //  UPDATE RIGHT PANEL ACCORDING TO THE CHOICES
            var answerable = "<div class='moocchat-justification moocchat-justification-" + clickedNum + " selected h3'>" + "Justify your answer." + "<br /><br />";
            answerable += "<form id='form_justification' name='form_justification'><textarea required class='form-control' rows='3' id='moocchat-justification-blank' placeholder='Why did you choose " + String.fromCharCode(CHAR_CODE_A + clickedNum) + "?'></textarea>";
            answerable += "</div>";

            if ($(".moocchat-justification-area").html().length==0) {
              $(".moocchat-justification-area").html($(answerable));
            }
            if (stage != DISCUSS_PROBING_STAGE) {
              if($("#moocchat-justification-blank").val().length>0)
                enableNextButton(true);
              else
                enableNextButton(false);
            }
            $("#moocchat-justification-blank").keyup(function(e) {
              if($("#moocchat-justification-blank").val().length>0)
                enableNextButton(true);
              else
                enableNextButton(false);
            });

            $("#moocchat-justification-blank").focus();
          }
        });
      }

      $(".moocchat-left-panel").scrollTop(0);

      break;

    case DISCUSS_PROBING_STAGE:
        // TODO FIXME: This case has a bunch of code duplication!
        wantToQuit = true;
        if(numMembers>1) {  //  GROUPED
          $(".moocchat-left-panel-direction").html(DISCUSS_INSTRUCTION_HEADING_GROUP);
          $(".moocchat-right-panel-direction").html(DISCUSSION_CHATBOX_HEADING);
        }
        else {  //  SINGLETON
          $(".moocchat-left-panel-direction").html(DISCUSS_INSTRUCTION_HEADING_SINGLE);
          $(".moocchat-right-panel-direction").html(DISCUSSION_CHATBOX_HEADING);
        }

        //  IN COMMON
        setMainTimer(stage);
        $(".moocchat-reading").html(quiz["reading"]);

        //  SHOW SHARED EVALUATION
        // Removed: still need question for context
        // $('.moocchat-post-reading-direction').html("");
        var shared = "<div class='list-group'>";
        for(var i=0;i<probAnswers.length;i++) {
          shared += "<div class='list-group-item'>";
          var resp = probAnswers[i]["answer"];
          var respJustification = probAnswers[i]["justification"];
          // var un = probAnswers[i]["username"];
          // var sn = "";

          // for(var j=0;j<userList.length;j++) {
          //   if(userList[j]["username"]==un) {
          //     sn = userList[j]["screenName"];
          //     break;
          //   }
          //   else {
          //     continue;
          //   }
          // }

          var sn = probAnswers[i].screenName;

          // shared += "<h4 class='list-group-item-heading'>" + "<span class='" + getSlug(sn) + "'>" + sn + "</span>" + " responded '" + resp + "'</h4>";
          shared += "<h4 class='list-group-item-heading'>" + "<span class='" + getSlug(sn) + "'>" + sn + "</span>" + " responded " + "<span class='moocchat-choice-box moocchat-choice-box-" + resp + "'>" + String.fromCharCode(CHAR_CODE_A + resp) + "</span>" + " Justification: " + respJustification + "</h4>";
          // shared += "<p class='list-group-item-text'>" + promptResps[i]["promptResp"]["promptAnswer"] + "</p>";
          shared += "</div>";
        }

        $(".moocchat-prompt-share-area").html("");
        $(".moocchat-prompt-share-area").append(shared);

        //  CHANGE NEXT BUTTON INTO REQUEST TO QUIT BUTTON
        $(".moocchat-next-button").html(END_CHAT_BUTTON_TEXT);
        enableNextButton(true);
        $(".moocchat-next-button").removeClass("btn-info");
        $(".moocchat-next-button").addClass("btn-danger");

        //  CHAT BOX, TEXT INPUT, AND SEND BUTTON
        var chatDiv = "<div class='moocchat-chat'>";
        chatDiv += "</div>";
        chatDiv += "<input class='form-control' id='moocchat-chat-input' name='moocchat-chat-input' type='text' placeholder='Type message here.' autocomplete='off' />&nbsp;";
        chatDiv += "<button id='moocchat-chat-send' type='button' class='btn btn-warning'>Send</button>";
        $(".moocchat-chat-area").empty(); // Erase old chat
        $(".moocchat-chat-area").append(chatDiv);
        // else alert("why?");

        //  EVENT LISTENER FOR CHAT
        // $("#moocchat-chat-send").click(function() {
        //   var message = $("#moocchat-chat-input").val();
        //   if(message.length==0) return;
        //   var msg = {username:username, quizRoomID:quizRoomID, screenName:screenName, message:message};
        //   socket.emit("chatMessage", msg);
        //   $("#moocchat-chat-input").val("");
        //   $("#moocchat-chat-input").focus();
        // });

        $("#moocchat-chat-input").keydown(function(e) {
          if(e.which==TAB_KEY_CODE) {
            $("#moocchat-chat-send").focus();
            e.stopPropagation();
          }
          if(e.which==ENTER_KEY_CODE) $("#moocchat-chat-send").click();
        });

        $("#moocchat-chat-send").keydown(function(e) {
          if(e.which==TAB_KEY_CODE) {
            $("#moocchat-chat-input").focus();
            e.stopPropagation();
          }
          if(e.which==ENTER_KEY_CODE) $("#moocchat-chat-send").click();
        });

        //  SHOW WELCOME MESSAGE
        for(var i=0;i<probAnswers.length;i++) {
          // var un = probAnswers[i]["username"];
          // var sn = "";

          // for(var j=0;j<userList.length;j++) {
          //   if(userList[j]["username"]==un) {
          //     sn = userList[j]["screenName"];
          //     break;
          //   }
          //   else {
          //     continue;
          //   }
          // }
          
          var sn = probAnswers[i].screenName;
          
          if(username==un) {
            showIncomingMessage({username:"system", quizRoomID:quizRoomID, screenName:"system", message:"You joined discussion as " + sn + "."});
          }
          else {
            showIncomingMessage({username:"system", quizRoomID:quizRoomID, screenName:"system", message:sn + " joined discussion."});
          }
        }

        $("#moocchat-chat-input").focus();
      // }

      break;

    case PROBING_REVISE_STAGE:
      // TODO FIXME: Duplicates lots of code with other case PROBING_QUESTION_STAGE

      //  IN COMMON
      setMainTimer(stage);
      if(numMembers>1) {  //  GROUPED
          $(".moocchat-left-panel-direction").html(PROBING_REVISE_INSTRUCTION_HEADING_GROUP);
      } else {
        $(".moocchat-left-panel-direction").html(PROBING_REVISE_INSTRUCTION_HEADING_SINGLE);
      }
      $(".moocchat-right-panel-direction").html(PROBING_REVISE_JUSTIFICATION_HEADING);

      $(".moocchat-next-button").html(SUBMIT_BUTTON_TEXT);
      $(".moocchat-next-button").removeClass("btn-danger");
      $(".moocchat-next-button").addClass("btn-info");
      if($("#moocchat-justification-blank").val().length>0)
        enableNextButton(true);
      else
        enableNextButton(false);
      $(".moocchat-left-panel").scrollTop(0);
      break;

    case PROBING_EXPLANATION_STAGE:

      //  IN COMMON
      setMainTimer(stage);

      $(".moocchat-left-panel-direction").html(EXPLANATION_INSTRUCTION_HEADING);
      $(".moocchat-right-panel-direction").html(EXPLANATION_CORRECT_ANSWER_HEADING);

      //  STYLING NEXT BUTTON
      $(".moocchat-next-button").html("Next");
      $(".moocchat-next-button").removeClass("btn-danger");
      $(".moocchat-next-button").removeClass("btn-success");
      $(".moocchat-next-button").addClass("btn-info");
	  $(".main-task-timer").css('visibility','hidden');
      enableNextButton(true);

      //  SHOW EXPLANATION
      var correctAnswer = parseInt(quiz["probingQuestionAnswer"]);
      $(".moocchat-explanation-area").html("<div class='correct_answer'>The correct answer is " + "<span class='moocchat-choice-box moocchat-correct-ans moocchat-choice-box-" + correctAnswer + "'>" + String.fromCharCode(CHAR_CODE_A + correctAnswer) + "</span></div><br />");
      $(".moocchat-explanation-area").append("<div class='moocchat-explanation'>"+ quiz["explanation"] + "</div>");
		socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Main Task Page', event:'Displayed Right Answer and Explanation' });
      break;

    case EVALUATION_STAGE:

      //  IN COMMON
      setMainTimer(stage);
      $(".moocchat-left-panel-direction").html("Another essay and question are shown below. Select among the choices A, B, C, D, E.");
      $(".moocchat-right-panel-direction").html("Submit your answer and justification before the timer runs out.");

      //  STYLING NEXT BUTTON
      $(".moocchat-next-button").html("Next");
      enableNextButton(false);
      $(".moocchat-next-button").addClass("btn-info");
      $(".moocchat-next-button").removeClass("btn-danger");
      $(".moocchat-next-button").removeClass("btn-success");

      //  SHOW EVALUATION QUESTION
      $(".moocchat-reading").html(quiz["evaluationReading"]);
      $(".moocchat-post-reading-direction").html(quiz["evaluationQuestion"]);
      var choices = quiz["evaluationChoices"];
      isChoicesClickable = true;

      //  SHOW CHOICES
      $(".moocchat-choice-area").html("<div class='list-group moocchat-evaluation-choice'></div>");
      $(".moocchat-justification-area").html("");

      //  ADD CLICK EVENT LISTENER
      for(var i=0;i<choices.length;i++) {
        var c = getMOOCchatTypeChoice(choices[i], i, CHOICE_LABEL);
        $(".moocchat-evaluation-choice").append(c);

        c.click(function(e) {
          if(!isChoicesClickable) return;
          var clickedNum = parseInt($(this).attr("id").split("-").pop());
          if($.inArray(clickedNum, evaluationChoicesClicked)>=0) {  // CANCEL A CHOICE
            var index = evaluationChoicesClicked.indexOf(clickedNum);
			socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Main Task Page', event:'Answer Selected' });
            evaluationChoicesClicked[index] = -1;
            $(this).removeClass("selected");
            $(this).children(".moocchat-choice-box").html(String.fromCharCode(CHAR_CODE_A + clickedNum));
            enableNextButton(false);
            $(".moocchat-justification-area").html("");
          }
          else {  //  INITIAL CHOICE OR CHANGE CHOICE
            var index = evaluationChoicesClicked.indexOf(-1);
            socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Main Task Page', event:'Answer Changed' });
            if(index<0) { // NO VACANCY
              var past = evaluationChoicesClicked[0];
              evaluationChoicesClicked[0] = clickedNum;

              $(".moocchat-choice-" + past).removeClass("selected");
              $(".moocchat-choice-" + past).children(".moocchat-choice-box").html(String.fromCharCode(CHAR_CODE_A + past));

              $(".moocchat-choice-" + clickedNum).addClass("selected");
              $(".moocchat-choice-" + clickedNum).children(".moocchat-choice-box").html(CHECK_IMG);
              enableNextButton(false);
            }
            else {
              evaluationChoicesClicked[index] = clickedNum;
              $(this).addClass("selected");
              $(this).children(".moocchat-choice-box").html(CHECK_IMG);
              $(".moocchat-justification-area").html("");
              // $('.moocchat-justification-blank').val("");
              // enableNextButton(false);
            }


            //  UPDATE RIGHT PANEL ACCORDING TO THE CHOICES
            var answerable = "<div class='moocchat-justification moocchat-justification-" + clickedNum + " selected h3'>" + "Justify your answer." + "<br /><br />";
            answerable += "<textarea class='form-control' rows='3' id='moocchat-justification-blank' placeholder='Why did you choose " + String.fromCharCode(CHAR_CODE_A + clickedNum) + "?'></textarea>";
            answerable += "</div>";

            if ($(".moocchat-justification-area").html().length==0) {
              $(".moocchat-justification-area").html($(answerable));
            }
            if($("#moocchat-justification-blank").val().length>0)
              enableNextButton(true);
            else
              enableNextButton(false);
            $("#moocchat-justification-blank").keyup(function(e) {
              if(($("#moocchat-justification-blank").val().length>0) || stage == DISCUSS_PROBING_STAGE)
                enableNextButton(true);
              else
                enableNextButton(false);
            });

            $("#moocchat-justification-blank").focus();
          }
        });
      }

      $(".moocchat-left-panel").scrollTop(0);

      // //  SHOW CHOICES
      // $(".moocchat-evaluation-question-choice-area").append("<div class='list-group moocchat-evaluation-question-choice'></div>");

      // //  ADD CLICK EVENT LISTENER
      // for(var i=0;i<choices.length;i++) {
      //   var c = getMOOCchatTypeChoice(choices[i], i, CHOICE_LABEL);
      //   $(".moocchat-evaluation-question-choice").append(c);

      //   c.click(function(e) {
      //     if(!isChoicesClickable) return;
      //     var clickedNum = parseInt($(this).attr("id").split("-").pop());
      //     if($.inArray(clickedNum, evaluationChoicesClicked)>=0) {  // CANCEL A CHOICE
      //       var index = evaluationChoicesClicked.indexOf(clickedNum);
      //       evaluationChoicesClicked[index] = -1;
      //       $(this).removeClass("selected");
      //       $(this).children(".moocchat-choice-box").html(String.fromCharCode(CHAR_CODE_A + clickedNum));
      //       enableNextButton(false);
      //     }
      //     else {  //  INITIAL CHOICE OR CHANGE CHOICE
      //       var index = evaluationChoicesClicked.indexOf(-1);
      //       if(index<0) {
      //         //  NO VACANCY

      //         var past = evaluationChoicesClicked[0];
      //         evaluationChoicesClicked[0] = clickedNum;

      //         $(".moocchat-choice-" + past).removeClass("selected");
      //         $(".moocchat-choice-" + past).children(".moocchat-choice-box").html(String.fromCharCode(CHAR_CODE_A + past));

      //         $(".moocchat-choice-" + clickedNum).addClass("selected");
      //         $(".moocchat-choice-" + clickedNum).children(".moocchat-choice-box").html(CHECK_IMG);
      //         enableNextButton(true);
      //       }
      //       else {
      //         evaluationChoicesClicked[index] = clickedNum;
      //         $(this).addClass("selected");
      //         $(this).children(".moocchat-choice-box").html(CHECK_IMG);
      //         enableNextButton(true);
      //       }
      //     }
      //   });
      // }

      // setMainTimer(stage);

      // $(".moocchat-left-panel").scrollTop(0);

      break;

    // case PEER_ASSESSMENT_STAGE:

    //   if(isAssignedTo(PEER_ASSESSMENT_LOW)) {
    //     //  SKIP THIS STAGE: NO ASSESSMENT
    //     enableNextButton(true);
    //     $(".moocchat-next-button").click();
    //   }
    //   else if(isAssignedTo(PEER_ASSESSMENT_QUESTION)) {

    //     $(".moocchat-left-panel").scrollTop(0);

    //     $(".moocchat-left-panel-direction").html("The questions your group members generated are presented below. Rate how thoughtful the questions are.");
    //     $(".moocchat-right-panel-direction").html("You may refer to the explanation for the rating.")

    //     //  SHOW PEER-GENERATED QUESTIONS WITH RATING TOOLS IN THE LEFT PANEL
    //     for(var i=0;i<qnaSets.length;i++) {
    //       var qna = qnaSets[i];
    //       if(qna['respondent']!=username) continue; //  SKIP ONE'S OWN QUESTIONS
    //       qnaSets[i]['rating'] = 0;
    //       var q = qna['question'];
    //       // if(typeof q==='undefined') continue;  //  SKIP NULL
    //       if(typeof q==null) {  //  SKIP NULL
    //         q = 'Question not available. Please check the below to skip this question.';
    //         // continue;
    //       }
    //       var ratingTool = getStarRatingTool(i);
    //       var ratable = "<div class='moocchat-peer-question-" + i + " selected'>" + "<span>" + q + "</span>" + "<br />" + ratingTool + "</div>";
    //       $(".moocchat-peer-question-assessment-area").append(ratable);
    //     }

    //     //  ADD EVENT LISTENER
    //     $(".moocchat-peer-question-assessment-area .star").click(function(e) {
    //       var id = $(this).attr('id');
    //       var qNum = parseInt(id.split('-')[1]);
    //       var sNum = parseInt(id.split('-')[2]);
    //       console.log(qNum + ", " + sNum);

    //       //  UI CHANGE
    //       var stars = $($('.moocchat-peer-question-assessment-area')[qNum]).children('.star');
    //       for(var i=1;i<=5;i++) {
    //         if(i<=sNum) {
    //           $('#star-' + qNum + '-' + i).attr('src', FULL_STAR_SRC);
    //         }
    //         else {
    //           $('#star-' + qNum + '-' + i).attr('src', EMPTY_STAR_SRC);
    //         }
    //       }

    //       //  RATING
    //       qnaSets[qNum]['rating'] = sNum;
    //       var check = 1;
    //       for(var i=0;i<qnaSets.length;i++) {
    //         var qna = qnaSets[i];
    //         if(qna['respondent']!=username) continue; //  SKIP ONE'S OWN QUESTIONS
    //         check *= qna['rating'];
    //       }

    //       //  UPDATE NEXT BUTTON
    //       if(check==0) enableNextButton(false);
    //       else enableNextButton(true);

    //       e.stopPropagation();
    //     });
    //   }
    //   else if(isAssignedTo(PEER_ASSESSMENT_DISCUSSION)) {

    //     $(".moocchat-left-panel").scrollTop(0);

    //     $(".moocchat-left-panel-direction").html("The discussion log of your group is presented below. Rate how thoughtful the discussion is.");
    //     $(".moocchat-right-panel-direction").html("You may refer to the explanation for the rating.")

    //     //  SHOW PEER-GENERATED QUESTIONS WITH RATING TOOLS IN THE LEFT PANEL
    //     $(".moocchat-peer-discussion-assessment-area").html(chatObj);

    //     //  SHOW RATING TOOL IN THE LEFT PANEL
    //     discussionRating = 0;
    //     var ratingTool = getStarRatingTool(0);
    //     var ratable = "<div class='moocchat-peer-question-0 selected'><span>How thoughtful the discussion in your group was?</span><br />" + ratingTool + "</div>";
    //     $(".moocchat-peer-discussion-assessment-area").append("<br />" + ratable);

    //     //  ADD EVENT LISTENER
    //     $(".moocchat-peer-discussion-assessment-area .star").click(function(e) {
    //       var id = $(this).attr('id');
    //       var sNum = parseInt(id.split('-')[2]);
    //       console.log(sNum);

    //       //  UI CHANGE
    //       var stars = $($('.moocchat-peer-discussion-assessment-area')[0]).children('.star');
    //       for(var i=1;i<=5;i++) {
    //         if(i<=sNum) {
    //           $('#star-0' + '-' + i).attr('src', FULL_STAR_SRC);
    //         }
    //         else {
    //           $('#star-0' + '-' + i).attr('src', EMPTY_STAR_SRC);
    //         }
    //       }

    //       //  RATING
    //       discussionRating = sNum;
    //       console.log(discussionRating);

    //       //  UPDATE NEXT BUTTON
    //       if(discussionRating==0) enableNextButton(false);
    //       else enableNextButton(true);

    //       e.stopPropagation();
    //     });

    //   }
    //   else {
    //     console.log("UNDEFINED CONDITION DETECTED IN TRANSITION TO A STAGE");
    //   }

    //   //  IN COMMON
    //   setMainTimer(stage);

    //   //  STYLING NEXT BUTTON
    //   $(".moocchat-next-button").html("Finish");
    //   $(".moocchat-next-button").removeClass("btn-danger");
    //   $(".moocchat-next-button").removeClass("btn-info");
    //   $(".moocchat-next-button").addClass("btn-success");
    //   enableNextButton(false);

    //   $(".moocchat-post-reading-direction").html("");

    //   break;

    case EVAL_EXPLANATION_STAGE:

      //  IN COMMON
      setMainTimer(stage);

      $(".moocchat-left-panel-direction").html(EXPLANATION_INSTRUCTION_HEADING);
      $(".moocchat-right-panel-direction").html(EXPLANATION_CORRECT_ANSWER_HEADING);

      //  STYLING NEXT BUTTON
      $(".moocchat-next-button").html("Next");
      $(".moocchat-next-button").removeClass("btn-danger");
      $(".moocchat-next-button").removeClass("btn-success");
      $(".moocchat-next-button").addClass("btn-info");
      enableNextButton(true);

      //  SHOW EXPLANATION
      var correctAnswer = parseInt(quiz["evaluationAnswer"]);
      $(".moocchat-explanation-area").html("The answer is " + "<span class='moocchat-choice-box moocchat-choice-box-" + correctAnswer + "'>" + String.fromCharCode(CHAR_CODE_A + correctAnswer) + "</span><br />");
      $(".moocchat-explanation-area").append("<div class='moocchat-explanation'>"+ quiz["evalExplanation"] + "</div>");

      break;


    default:

      console.log("UNDEFINED STAGE DETECTED");

      break;
  }
}

function updatePage(pageID) {
  if (SINGLE_SIGN_ON == true) {
		var getUserName = $('#username').val();
  }
  switch(pageID) {
    case LOGIN_PAGE:
      console.log(LOGIN_PAGE);
      $.removeCookie(COOKIE_USERNAME, {path:"/"});  //  TO BE REMOVED
	  if (getUserName) {
	  //UQ Single Sign On
		$.cookie(COOKIE_USERNAME, getUserName, {path: "/"});
	  }
	  //----//
      if (turkWorkerId) {
        username = "Turk Worker " + turkWorkerId;
        console.log(username);
        $.cookie(COOKIE_USERNAME, username, {path: "/"});
        isCookieSet = true;
        goToPage(WAIT_PAGE);
      } else {
        $(LOGIN_PAGE + " #login-button").click(function(e) {  //  login button is clicked
          if(!isCookieSet) {
            // No String.trim in IE - see http://stackoverflow.com/questions/3439316/ie8-and-jquerys-trim
            username = $.trim($(LOGIN_PAGE + " #username").val());
          }
          if(username=="") return;
          console.log(username);
          $.cookie(COOKIE_USERNAME, username, {path: "/"}); // TO REMOVE COOKIE: $.removeCookie(COOKIE_USERNAME, {path:"/"});
          isCookieSet = true;
          $("#username").blur();
		  socket.emit('login_req', {username: username, password: "ischool", turkHitId: turkHitId, browserInformation: navigator.userAgent});

        });

        $(LOGIN_PAGE + " #username").keydown(function(e) {
          if(e.which != ENTER_KEY_CODE) return;
          $(LOGIN_PAGE + " #login-button").click();
        });

        if($.cookie(COOKIE_USERNAME)!=null) {
          isCookieSet = true;
          username = $.cookie(COOKIE_USERNAME);
		  socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Logged In - Wait Page', event: ""  });

          if(isCookieSet) $(LOGIN_PAGE + " #login-button").click();
        }

        $("#username").focus();
      }

      break;

    case CONSENT_PAGE:
      console.log(CONSENT_PAGE);

      socket.emit('getConsent', {username:username});

      $(CONSENT_PAGE + ' #consent-accept').click(function(e) {
        window.accept_value = CONSENT_ACCEPTED;
        socket.emit('setConsent', {username:username, value:window.accept_value, timestamp:new Date().toISOString()});
      });

      $(CONSENT_PAGE + ' #consent-reject').click(function(e) {
        window.accept_value = CONSENT_REJECTED;
        socket.emit('setConsent', {username:username, value:window.accept_value, timestamp:new Date().toISOString()});
      });

      break;

    case WAIT_PAGE:
		var username = $('#username').val();
		socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:'Instructions Page', event:'' });
      console.log(WAIT_PAGE);
      break;

    case LEARNING_PAGE:

      $('.moocchat-learning-reading').html(quiz['reading']);
      $("#promptResp").focus();

      break;

    case MAIN_TASK_PAGE:
      console.log(MAIN_TASK_PAGE + ": stage " + stage);
	  socket.emit('user_flow', {username: getUserName, timestamp:new Date().toISOString(), page:'Main Task Page', event:''  });
      $(".moocchat-conditional").addClass("hidden"); //  HIDE ALL THE CONDITIONAL ELEMENTS
      // $(".moocchat-control-panel").removeClass("hidden"); //  SHOW THE CONTROL PANEL
      resetStage(conditionAssigned, stage);
      renderStage(conditionNames, stageName);

      break;

    case IDLE_PAGE:
	socket.emit('user_flow', {username: getUserName, timestamp:new Date().toISOString(), page:'Idle Page', event: ""  });
      console.log(IDLE_PAGE);
      //  DO ALMOST NOTHING BUT WAIT FOR EVENTS RAISED BY THE SERVER

      switch(stage) {

        case READ_STAGE:
          $(IDLE_PAGE + " #idle-message").html(WAITING_FOR_MAIN_TASK_PAGE);
          break;

        case DISCUSS_ASSUMPTION_STAGE:

          $(IDLE_PAGE + " #idle-message").html(WAITING_FOR_MAIN_TASK_PAGE);

          break;

        case DISCUSS_PROBING_STAGE:
		  enableNextButton(false);
          $(IDLE_PAGE + " #idle-message").html(WAITING_FOR_DISCUSSION);
          break;

        case PROBING_EXPLANATION_STAGE:
        case EVAL_EXPLANATION_STAGE:

          //  WAITING_FOR_EXPLANATION
          $(IDLE_PAGE + " #idle-message").html(WAITING_FOR_EXPLANATION);

          break;
      }

      break;

    case POST_SURVEY_PAGE:

	  pauseGroupTimer(); //It pauses the timer, otherwise completed page (last page) will go back to Survey Page and wont be able to proceed. Added 23/07/2015
	  socket.emit('user_flow', {username: getUserName, timestamp:new Date().toISOString(), page:'Survey Page', event:''  });
      console.log(POST_SURVEY_PAGE);
      break;

    case SUBMIT_HIT_PAGE:
      console.log(SUBMIT_HIT_PAGE);
      break;

	//Added 23/07/2015
	case INVALID_LOGIN:
		socket.emit('user_flow', {username: getUserName, timestamp:new Date().toISOString(), page:'Invalid Login Page', event:''  });
		console.log(INVALID_LOGIN);
     break;

	case COMPLETED_PAGE:
		socket.emit('user_flow', {username: getUserName, timestamp:new Date().toISOString(), page:'Completed', event:''  });
		console.log(COMPLETED_PAGE);
     break;
    default:
      console.log("UNDEFINED PAGE: something's wrong!");

      break;
  }
}

function memberDisconnected(disconnectedMemberUsername) {
  //  IN COMMON
  numMembers--;
  //  TODO: SEND A REPORT TO THE SERVER

  if(currentPage==MAIN_TASK_PAGE) {

    switch(stage) {

      case READ_STAGE:
        //  DO NOTHING: TESTED
        break;

      case DISCUSS_ASSUMPTION_STAGE:
      case DISCUSS_PROBING_STAGE:
        //  SHOW A SYSTEM MESSAGE SAYING SOMEONE DISCONNECTED: TESTED
        var sn = 'A student in this group';
        for(var i=0;i<userList.length;i++) {
          var user = userList[i];
          if(username==user['username']) {
            sn = user['screenName'];
            break;
          }
        }
        var message = sn + ' has disconnected. You can still finish this task, though.';
        showIncomingMessage({username:'system', quizRoomID:quizRoomID, screenName:'system', message:message});
        break;

      case PROBING_QUESTION_STAGE:
      case PROBING_REVISE_STAGE:
        //  DO NOTHING: TESTED
        //  DO NOTHING REGARDLESS OF THE SUBSTAGES: TESTED

        break;

      case PROBING_EXPLANATION_STAGE:
      case EVAL_EXPLANATION_STAGE:

        //  DO NOTHING

        break;

      case EVALUATION_STAGE:

        //  DO NOTHING

        break;

      default:
        console.log("UNDEFINED STAGE DETECTED");

        break;
    }
  }
  else if(currentPage==IDLE_PAGE) {
    switch(stage) {

      case -1:
        //  BEFORE BEING GROUPED
        //  DO NOTHING: NOT TESTED, BUT LOGICALLY NOTHING TO DO
        break;

      case READ_STAGE:
        //  AFTER READING OR ANSWERING PEER-GENERATED QUESTIONS
        // if(numMembers==1) {
          //  DON'T NEED TO WAIT: CALL broadcastPeerGeneratedQuestions(quizRoomID) on the SERVER
          // socket.emit('proceedAfterMemberDropsReq', {username:username, quizRoomID:quizRoomID, stage:stage});
        // }
        // else {
          //  WAIT UNTIL THE TIMER RUNS OUT. THE TIMER WILL ASK SERVER FOR EVENT AND DATA TO PROCEED.
          //  DO NOTHING HERE
        // }
        break;

      case DISCUSS_ASSUMPTION_STAGE:
      case DISCUSS_PROBING_STAGE:
        //  AFTER DISCUSSION
        //  THIS STAGE DOESN'T EXIST FOR NOW: WHEN DISCUSSION ENDS, USERS MOVE TO PROBING_QUESTION_STAGE OF MAIN_TASK_PAGE, BUT NOT IDLE_PAGE.
        break;

      case PROBING_QUESTION_STAGE:
      case PROBING_REVISE_STAGE:
        // if(numMembers==1) {
          //  DON'T NEED TO WAIT
          // socket.emit('proceedAfterMemberDropsReq', {username:username, quizRoomID:quizRoomID, stage:stage});
        // }
        // else {
          //  WAIT UNTIL THE TIMER RUNS OUT. THE TIMER WILL ASK SERVER FOR EVENT AND DATA TO PROCEED.
          //  DO NOTHING HERE
        // }
        break;

      case PROBING_EXPLANATION_STAGE:
      case EVAL_EXPLANATION_STAGE:
        // if(numMembers==1) {
          //  DON'T NEED TO WAIT
        //   socket.emit('proceedAfterMemberDropsReq', {username:username, quizRoomID:quizRoomID, stage:stage});
        // }
        // else {
          //  WAIT UNTIL THE TIMER RUNS OUT. THE TIMER WILL ASK SERVER FOR EVENT AND DATA TO PROCEED.
          //  DO NOTHING HERE
        // }
        break;

      case EVALUATION_STAGE:

        break;

      default:
        console.log("UNDEFINED STAGE DETECTED");

        break;
    }
  }
  else {
    //  DO NOTHING
  }
}

function pauseGroupTimer() {
  paused = !paused;
}

function pause() {
  socket.emit('pauseGroupTimer', {quizRoomID:quizRoomID});
}





// var lClient = {};
// var loadtestOptions = {
//   // url: 'localhost',
//   maxRequest: -1,
//   maxDurationSec: 3600,
//   requestIntMs: 30
// };

// // var loadtestOptions = require('./conf_load_test.json');

// var results = {
//   elapsed: 0,
//   numRequest: 0,
//   numResponse: 0,
//   byteSent: 0,
//   byteReceived: 0,
//   requestIntMs: loadtestOptions.requestIntMs
// };

// var timestamps = [];
// var diffs = [];

// var loadTestFinished = false;
// var responseObj = {};

// // var socket = io.connect(loadtestOptions.url, {'port':8889, 'force new connection': true});

// function loadTestResponse(resp) {  //  resp {}
//   var last = timestamps.length-1;
//   timestamps[last].receive = new Date().getTime();
//   if(typeof diffs !== 'undefined') diffs.push(timestamps[last].receive - timestamps[last].send);

//   responseObj = resp;
//   results.numResponse++;
//   results.byteReceived += sizeof(responseObj);
// }

// function dumpResults() {
//   // var outputFilename = 'load_test_results_' + (new Date()).getTime() + '.json';

//   clearInterval(lClient.timer);

//   results.failed = results.numRequest - results.numResponse;
//   results.reqPerSec = results.numRequest / results.elapsed;
//   results.timePerReq = results.elapsed / results.numRequest;
//   results.sendRate = results.byteSent / results.elapsed;
//   results.sendRate = results.byteReceived / results.elapsed;

//   diffs.sort(function(a,b){return a-b;});
//   var last = diffs.length - 1;
//   results.percentile10 = diffs[Math.floor(last * 0.1)];
//   results.percentile20 = diffs[Math.floor(last * 0.2)];
//   results.percentile30 = diffs[Math.floor(last * 0.3)];
//   results.percentile40 = diffs[Math.floor(last * 0.4)];
//   results.percentile50 = diffs[Math.floor(last * 0.5)];
//   results.percentile60 = diffs[Math.floor(last * 0.6)];
//   results.percentile70 = diffs[Math.floor(last * 0.7)];
//   results.percentile80 = diffs[Math.floor(last * 0.8)];
//   results.percentile90 = diffs[Math.floor(last * 0.9)];
//   results.percentile95 = diffs[Math.floor(last * 0.95)];
//   results.percentile98 = diffs[Math.floor(last * 0.98)];
//   results.percentile99 = diffs[Math.floor(last * 0.99)];
//   results.percentile100 = diffs[last];

//   socket.emit('saveLoadTestResults', {results:results, options:loadtestOptions});
//   window.location.reload();
//   // $('body').html(JSON.stringify(results, null, 2));

//   // fs.writeFile(outputFilename, JSON.stringify(results, null, 2), function(err) {
//   //   if(err) {
//   //     console.log(err);
//   //   }
//   //   else {
//   //     console.log("The results has been saved to " + outputFilename);
//   //     process.exit(0);
//   //   }
//   // });
// }

// function loadTestClient() {
//   results.started = 0;
//   this.timer = {};
// }
// loadTestClient.prototype.start = function() {
//   results.started = new Date().getTime();
//   console.log("#load test client started.");
//   this.loadTestRequest(loadtestOptions.maxRequest);
// };
// loadTestClient.prototype.loadTestRequest = function(maxReq) {
//   this.timer = setInterval(function() {
//     results.elapsed = (new Date().getTime() - results.started) / 1000;
//     if(Math.floor(results.elapsed)>=loadtestOptions.maxDurationSec) {
//       loadTestFinished = true;
//       // clearInterval(this.timer);
//       dumpResults();
//       return;
//     }
//     else {
//       var toSend = new Date().getTime();
//       timestamps.push({send: toSend});
//       socket.emit('loadTestReq', toSend);
//       results.numRequest++;
//       results.byteSent += sizeof(toSend);
//     }
//   }, loadtestOptions.requestIntMs);
// };

// function startLoadTest(timeMs) {
//   if(typeof time !== 'undefined') loadtestOptions.maxDurationSec = timeMs;
//   lClient = new loadTestClient();
//   lClient.start();
//   lClient.loadTestRequest(loadtestOptions.maxRequest);
// }

/*
sizeof.js
A function to calculate the approximate memory usage of objects
Created by Stephen Morley - http://code.stephenmorley.org/ - and released under
the terms of the CC0 1.0 Universal legal code:
http://creativecommons.org/publicdomain/zero/1.0/legalcode
*/
function sizeof(_1){
var _2=[_1];
var _3=0;
for(var _4=0;_4<_2.length;_4++){
switch(typeof _2[_4]){
case "boolean":
_3+=4;
break;
case "number":
_3+=8;
break;
case "string":
_3+=2*_2[_4].length;
break;
case "object":
if(Object.prototype.toString.call(_2[_4])!="[object Array]"){
for(var _5 in _2[_4]){
_3+=2*_5.length;
}
}
for(var _5 in _2[_4]){
var _6=false;
for(var _7=0;_7<_2.length;_7++){
if(_2[_7]===_2[_4][_5]){
_6=true;
break;
}
}
if(!_6){
_2.push(_2[_4][_5]);
}
}
}
}
return _3;
}


var sec = 0;
var clock;
function startClock() {
		clock = setInterval("stopWatch()", 1000);
}
function stopWatch() {
	sec++;
	return(sec);
}
function restartClock() {
	window.clearInterval(clock);
	sec = 0;
	startClock();
}
function pageReload() {
    location.reload();
	ga('send','event','Page Reload');
}

$(window).bind('beforeunload', function(){
	var url = window.location.href;
	var hash = url.substring(url.indexOf("#")+1);


		if (hash !== 'wait-page' && hash !== 'completed-page' && hash !== 'login-invalid') {
			socket.emit('user_flow', {username: username, timestamp:new Date().toISOString(), page:hash, event:'Trying to refresh or quit' });
			return 'You are trying to refresh or exit the page. This might end the session you are in.';
		}
	});
