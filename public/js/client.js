//  START CONSTANTS
var ONE_SECOND = 1000;
var CHOICE_COLORS = ['#3232ff', '#ff9600', '#e632ff', '#14c80a', '#00dcff', '#ff8080', '#6d74cc', '#901193', '#119345', '#ce1b02'];
var CHOICE_SHADOW_COLORS = ['#c1c1ff', '#ffdfb2', '#f7c1ff', '#b8eeb5', '#b2f4ff', '#ffd9d9', '#d3d5f0', '#ddb7de', '#b7dec7', '#f0bab3'];
var CHECK_IMG = "<img src='./img/check.svg' />";
var NEXT_BUTTON_LABELS = ['Submit First Choice', 'Done Discussing', 'Submit Final Choice', 'Done'];
var BUTTON_LABEL_COLORS = ['#3a3a3a', '#fafafa'];
var CHAT_SPEAKER_BACKGROUND_COLORS = ['#c4ff54', '#ff9985', '#a0bfff'];
var NEXT_BUTTON_CLASSES = ['button button-rounded button-flat-primary', 'button button-rounded button-flat-highlight', 'button button-rounded button-flat-caution', 'button button-rounded button-flat-primary'];
var NEXT_BUTTON_DISABLED_CLASSES = ['button disabled button-rounded button-flat-primary', 'button disabled button-rounded button-flat-highlight', 'button disabled button-rounded button-flat-caution', 'button disabled button-rounded button-flat-primary'];
var SEND_BUTTON_CLASS = "button button-rounded button-flat-action";
var SEND_BUTTON_DISABLED_CLASS = "button disabled button-rounded button-flat-action";
var FLAG_BUTTON_CLASS = "button button-rounded button-flat-royal";
var FLAG_BUTTON_DISABLED_CLASS = "button disabled button-rounded button-flat-royal";
var CHAR_CODE_A = 65;
var ENTER_KEY_CODE = 13;
var FIRST_CHOICE_STAGE = 0;
var DISCUSSION_STAGE = 1;
var FINAL_CHOICE_STAGE = 2;
var EXPLANATION_STAGE = 3;
var CURRENT_CHOICE_REMINDER_PREFIX = "Your current choice is ";
var FIRST_CHOICE_REMINDER_PREFIX = "Your first choice was ";
var FINAL_CHOICE_REMINDER_PREFIX = "Your final choice is ";
var NO_FIRST_CHOICE_REMINDER_PREFIX = "You haven't chosen your first answer";
var NO_FINAL_CHOICE_REMINDER_PREFIX = "You haven't chosen your final answer";
var MINIMUN_CHAT_TO_QUIT = 1;
var CONTEXTUAL_NOTICES = ["Choose an answer and click the submit button before the timer runs out.", "Discuss this question until the timer runs out. You may change your answer choice during the discussion.", "You may change your answer. Submit the final choice before the timer runs out.", "Check the correct answer and the explanation."];
var WAITING_MESSAGES = ['You will have a question when other students are ready', 'You will have discussion when other students are ready', 'Please wait...', 'You will have a question when other students are ready'];
var WARNING_MESSAGE_FIRST_CHOICE_STAGE_WITHOUT_BONUS = '<br /><br /><br />In the chatroom that follows you will have a conversation with either one or two other students. You are encouraged to consider and discuss all the answers carefully.';
var WARNING_MESSAGE_FIRST_CHOICE_STAGE_WITH_BONUS = '<br /><br /><br />In the chatroom that follows you will have a conversation with either one or two other students.  You are encouraged to consider and discuss all the answers carefully.<br/><br/>If there are at least two users and you all arrive at the correct answer, you will receive a <b>$2 bonus</b> in addition to your $2 payment.';
var WARNING_MESSAGE_FINAL_CHOICE_STAGE = '<br /><br /><br />You must submit your final choice within the time limit. You may still change your choice now.';
var SYSTEM_MESSAGE_SOURCE = "MoocChatSystem";
var SYSTEM_WELCOME_MESSAGE = 1000;
var SYSTEM_FLAG_MESSAGE = 2000;
var SYSTEM_KEEP_TALKING_MESSAGE = 3000;
var SYSTEM_BONUS_CONDITION_MESSAGE = 4000;
var SYSTEM_REASONING_MESSAGE = 5000;
var SYSTEM_DISCONNECTED_MESSAGE = 6000;
var SYSTEM_ALONE_MESSAGE = 7000;
var SYSTEM_QUIT_REQ_MESSAGE = 8000;
var SYSTEM_QUIT_CANCEL_MESSAGE = 9000;
var SYSTEM_QUIT_MESSAGE = 10000;

var SYSTEM_MESSAGE_MY_WELCOME_PREFIX = "You joined the discussion as ";
var SYSTEM_MESSAGE_MY_WELCOME_POSTFIX = "<br />with first answer choice ";
var SYSTEM_MESSAGE_OTHERS_WELCOME = " has joined discussion<br />with first choice ";
var SYSTEM_MESSAGE_FLAG_POSTFIX = " has been flagged.<br />This system message is only visible to you.";
var SYSTEM_MESSAGE_DISCONNECTED_POSTFIX = " has disconnected.";
var SYSTEM_MESSAGE_KEEP_TALKING_PREFIX = "Please continue discussing this question.";
var SYSTEM_MESSAGE_BONUS_CONDITION_PREFIX = "You will get paid a <b>$2 bonus</b> if all the students in this discussion get the correct answer.";
var SYSTEM_MESSAGE_REASONING_PREFIX = "Explain the reason why you chose your answer.  If you want to change your answer, give the reason why."
var SYSTEM_MESSAGE_ALONE = "No one else was available to chat with you. Please briefly describe why you chose your selected choice, then click Quit Discussion to continue.";
var SYSTEM_MESSAGE_QUIT_REQ_POSTFIX = " made quit request. You may quit the discussion if all the members request.";
var SYSTEM_MESSAGE_QUIT_CANCEL_POSTFIX = " canceled the quit request. You may quit the discussion if all the members request.";

var FINAL_CHOICE_ALERT = 'You must select a final answer among the choices.';
var SCROLL_SPEED = 40;
var SILENCE_LIMIT = 45;
var GROUP_TIME_OUT = 30;

var TIMER_ON = [true, true, true, true];

//  START CLIENT STATE CONSTANTS
var CLIENT_STATE_IDLE = 100;
var CLIENT_STATE_QUIZ_WAITLIST = 101;
var CLIENT_STATE_FIRST_CHOICE_STAGE = 102;
var CLIENT_STATE_DISCUSSION_WAITLIST = 103;
var CLIENT_STATE_DISCUSSION_STAGE = 104;
var CLIENT_STATE_FINAL_CHOICE_STAGE = 105;
var CLIENT_STATE_EXPLANATION_STAGE = 106;
//  END CLIENT STATE CONSTANTS

var COOKIE_USERNAME = "moocchat_username";
//  END CONSTANTS

//  START GLOBAL VARIABLES
var socket;
var socketID = "";
var clientState = CLIENT_STATE_IDLE;
var username = "";
var screenName = "";
var quizCounter = 0;
var quizRoomID = "";
// var bonusCondition = -1;
var caseAssigned = -1;
var isAlone = false;
var quiz = {};
var discussionRoomID = "";
var numMembers = -1;
var quizRoomState = -1;
var firstChoice = -1;
var finalChoice = -1;
var finalChoiceClicked = false;
var messageCounter = -1;
var myMessageCounter = -1;
var emphasizingTimer;
var timer;
var timeLimits;
var timerEnds;
var quizWaitTimer;
var correctAnswerPopupTimer;
var lastChat = new Date();
var nextButtonEnabled = false;
var sendButtonEnabled = false;
var timerControlStopped = false;
var scrollPosition = 0;
var surveyAnswers = new Array();
var COOKIE_SET = false;
var choicesEnabled = true;
var finalSubmitButtonClicked = false;
var correctAnswer = -1;
var discussionQuitReq = true;
var discussionQuitAgreed = false;
var numDiscussionQuitReq = -1;
//  END GLOBAL VARIABLES

function init() {
    // require(setting.js);
    // initContinue();
    $.getScript("js/settings.js", function(){
        initContinue();
    });
}

function initContinue() {
    //  START
    if($.cookie(COOKIE_USERNAME)!=null) {
        COOKIE_SET = true;
        username = $.cookie(COOKIE_USERNAME);
    }

    showUI('wait_ui', false);
    showUI('quiz_ui', false);
    showUI('discussion_ui', false);
    showUI('warning_ui', false);
    showUI('login_ui', false);
    showUI('submit_hit_ui', false);

    socket = connect();

    //  START USER EVENT HANDLERS
    if (gup('stop') != "") {
        // Secret GET parameter to stop server - note, is not secure
        socket.emit('stop');
        return;
    }

    // assignmentId = gup('assignmentId');
    // if (assignmentId == "") {
    // Blank assignmentId means directly accessing URL for testing,
    // present login UI
    // showUI('login_ui', true);
    // $('#login_button').click(function(event) {
    // var u = $('#username').val();
    // var p = $('#password').val();
    socket.emit('login_req', {username: username, password: "ischool"});
    // });
    // } else {
    // 'ischool' password will create new user if needed
    //   socket.emit('login_req', {username: gup('workerId'), password: 'ischool'});
    // }

    //  login form: not used after edX integration
    $('#username').keydown(function(e) {
        if(e.which != ENTER_KEY_CODE) return;
        $('#password').focus();
    });

    $('#password').keydown(function(e) {
        if(e.which != ENTER_KEY_CODE) return;
        $('#login_button').click();
    });

    $('#next_button').click(function(event) {
        if(!nextButtonEnabled && timeLimits[quizRoomState]>0) {
            emphasizeInstruction(ONE_SECOND);
        }
        else {
            if(quizRoomState==FIRST_CHOICE_STAGE) {  //  FIRST CHOICE STAGE
                clearInterval(timer);
                submitFirstChoice({username:username, quizRoomID:quizRoomID, firstChoice:parseInt(firstChoice)});
            }
            else {
                if(quizRoomState==DISCUSSION_STAGE) {  //  DISCUSSION STAGE
                    if(!discussionQuitAgreed) {
                        if(discussionQuitReq) {
                            $('#next_button_label').html("Cancel Request");
                        }
                        else {
                            $('#next_button_label').html("Done Discussing");
                        }
                        socket.emit('discussionQuitReq', {screenName:screenName, discussionRoomID:discussionRoomID, firstChoice:firstChoice, caseAssigned:caseAssigned, discussionQuitReq:discussionQuitReq});
                        discussionQuitReq = !discussionQuitReq;
                    }
                    else {
                        $('#next_button_label').html("Done Discussing");
                        clearInterval(timer);
                        setClientState(CLIENT_STATE_FINAL_CHOICE_STAGE);
                    }
                }
                else {
                    if(quizRoomState==FINAL_CHOICE_STAGE) {  //  FINAL CHOICE STAGE
                        clearInterval(timer);
                        setClientState(CLIENT_STATE_EXPLANATION_STAGE);
                    }
                    else {  //  EXPLANATION STAGE
                        clearInterval(timer);
                        finalSubmission({username:username, quizRoomID:quizRoomID, discussionRoomID:discussionRoomID, caseAssigned:caseAssigned, firstChoice:parseInt(firstChoice), finalChoice:parseInt(finalChoice), correctAnswer:correctAnswer});
                    }
                }
            }
        }
    });
    //  login form: not used after edX integration

    $("#outgoing-message").keydown(function(e) {
        if(e.which == ENTER_KEY_CODE) {
            $("#send").click();
        }
    });

    $("#send").click(function() {
        if(!sendButtonEnabled || $("#outgoing-message").val().length==0) return;
        var msg = {username:username, quizRoomID:quizRoomID, discussionRoomID:discussionRoomID, screenName:screenName, firstChoice:firstChoice, caseAssigned:caseAssigned, message:$("#outgoing-message").val()};
        socket.emit('message', msg);
        $("#outgoing-message").val('');
        $("#outgoing-message").focus();
    });
    //  END USER EVENT HANDLERS

    //  START SOCKET EVENT HANDLERS
    socket.on('disconnect', disconnected);
    socket.on('socketConnected', connectionConfirmed);
    socket.on('clientState', initialStateSet);
    socket.on('loginFailure', loginFailed);
    socket.on('loginExistingUser', loginExistingUser);
    socket.on('loginSuccess', quizWaitlistReq);
    socket.on('comeBackLater', comeBackLater);
    socket.on('groupedForQuiz', updateQuizWaitlistReq);
    socket.on('quizWaitlistUpdated', joinQuizRoomReq);
    socket.on('joinedForQuiz', quizReq);
    socket.on('quiz', startQuiz);
    socket.on('groupedForDiscussion', updateDiscussionWaitlistReq);
    socket.on('discussionWaitlistUpdated', joinDiscussionRoomReq);
    socket.on('joinedForDiscussion', startDiscussion);
    socket.on('discussionUserList', registerUserList);
    socket.on('message', showIncomingMessage);
    socket.on('stopTimer', stopTimer);
    socket.on('resumeTimer', resumeTimer);
    socket.on('timerToThree', timerToThree);
    // socket.on('correctAnswer', updateCorrectAnswer);
    socket.on('finalChoiceUpdated', quizWaitlistReq);
    // socket.on('completed', postSurvey);
    socket.on('completed', finish);
    socket.on('surveySaved', finish);
    socket.on('missingClient', missingClient);
    socket.on('illegalMessage', illegalMessage);
    //  END SOCKET EVENT HANDLERS

    // Gets URL Parameters (GUP)
    function gup( name )
    {
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var tmpURL = window.location.href;
        var results = regex.exec( tmpURL );
        if( results == null )
            return "";
        else
            return results[1];
    }

    // Decodes query parameters that were URL-encoded
    function decode(strToDecode)
    {
        var encoded = strToDecode;
        return unescape(encoded.replace(/\+/g,  " "));
    }



    function disconnected() {
        console.log("disconnected() - username: %s, clientState: %d", username, clientState);
        // Disabled - this displays when navigating away, etc.
        // alert("Disconnected from server. Please report this issue.");
    }

    function connectionConfirmed(id) {
        socketID = id;
        console.log("[" + socketID + "] connectionConfirmed()");
    }

    function initialStateSet(state) {
        setClientState(state);
        console.log("[" + socketID + "] initialStateSet() - " + clientState);
    }

    function loginFailed(msg) { //  msg:string
        alert("Login failed. " + msg);
        $('#password').val('');
    }

    function loginExistingUser(username) {
        alert("You have already completed this quiz. Each student may only complete this quiz once. Please try again when another quiz set is ready.");
        // alert("You have already completed this HIT. Each Turker may only complete this HIT once.");
    }

    function missingClient(username) {
        alert("Your user has been lost. This may be because the server was restarted. Your browser will now be refreshed. Please report this issue.");
        location.reload();    
    }

    function illegalMessage(errorMsg) {
        alert("The server encountered an error while processing a message from your client:\n" + errorMsg + "\nThis may be because the server was restarted. Your browser will now be refreshed. Please report this issue.");
        location.reload();    
    }

    function getTimerEnd(timeOut) {
        var now = new Date();
        return new Date(now.getTime() + timeOut * 1000);
    }

    function secondsRemaining(timerEnd) {
        var now = new Date();
        if (timerEnd.getTime() < now.getTime()) return 0;
        return Math.floor((timerEnd.getTime() - now.getTime())/1000);
    }

    function quizWaitlistReq(data) {  //  data:{username}
        username = data.username;
        setClientState(CLIENT_STATE_QUIZ_WAITLIST);

        console.log("[" + username + "] quizWaitlistReq()");
        showUI('discussion_ui', false);
        showUI('wait_ui', true);

        socket.emit('quizWaitlistReq', {username:username});

        var groupTimeOut;
        if (typeof timeLimits == 'undefined') {
            groupTimeOut = GROUP_TIME_OUT;
        } else {
            groupTimeOut = timeLimits[quizRoomState] + GROUP_TIME_OUT;
        }
        var timerEnd = getTimerEnd(groupTimeOut);
        quizWaitTimer = setInterval(function() {
            groupTimeOut = secondsRemaining(timerEnd);
            $('#quiz_wait_time_out').html('within ' + getMinute(groupTimeOut)+' : '+getSecond(groupTimeOut) + '.');

            if(groupTimeOut<0) {
                $('#quiz_wait_time_out').html('within 00 : 00.');
                socket.emit('quizWaitlistForceProceed', {username:username});
                clearInterval(quizWaitTimer);
            }
        }, ONE_SECOND);
    }

    function comeBackLater(data) {  //  data:{username}
        alert("No other students are available at the current time to group with you. Please try again in a future session.");
        location.replace("./wait.html");
    }

    function updateQuizWaitlistReq(data) {  //  data:{username, quizRoomID, caseAssigned}
        clearInterval(quizWaitTimer);
        quizRoomID = data.quizRoomID;
        caseAssigned = data.caseAssigned;

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
    }

    function startQuiz(data) { //  data:{username, quizRoomID, quiz);
        console.log("[" + username + "] startQuiz() - quizRoomID: " + quizRoomID);
        quiz = data.quiz;
        setClientState(CLIENT_STATE_FIRST_CHOICE_STAGE);
    }

    function submitFirstChoice(submission) {  //  submission:{username, quizRoomID, firstChoice}
        clearInterval(timer);
        showUI('quiz_ui', false);
        showUI('wait_ui', true);
        showUI('quiz_ui', true);

        $('#quiz_wait_time_out').html('');

        socket.emit('firstChoiceSubmission', submission);
        setClientState(CLIENT_STATE_DISCUSSION_WAITLIST);

        var groupTimeOut = timeLimits[quizRoomState] + GROUP_TIME_OUT;
        var timerEnd = getTimerEnd(groupTimeOut);
        quizWaitTimer = setInterval(function() {
            groupTimeOut = secondsRemaining(timerEnd);
            $('#quiz_wait_time_out').html('within ' + getMinute(groupTimeOut)+' : '+getSecond(groupTimeOut) + '.');

            if(groupTimeOut<0) {
                $('#quiz_wait_time_out').html('within 00 : 00.');
                socket.emit('discussionWaitlistForceProceed', {username:username});
                clearInterval(quizWaitTimer);
            }
        }, ONE_SECOND);
    }

    function updateDiscussionWaitlistReq(data) { //  data:{username, discussionRoomID, caseAssigned}
        clearInterval(quizWaitTimer);
        discussionRoomID = data.discussionRoomID;
        caseAssigned = data.caseAssigned;
        console.log("[" + username + "] updateDiscussionWaitlistReq() - discussionRoomID: " + discussionRoomID + ", caseAssigned: " + caseAssigned);

        socket.emit('updateDiscussionWaitlistReq', {username:username, discussionRoomID:discussionRoomID, caseAssigned:caseAssigned});
    }

    function joinDiscussionRoomReq(data) { //  data:{username, discussionRoomID, caseAssigned}
        console.log("[" + username + "] joinDiscussionRoomReq() - discussionRoomID: " + discussionRoomID + ", caseAssigned: " + caseAssigned);

        socket.emit('joinDiscussionRoomReq', data);
    }

    function startDiscussion(data) {  //  data:{username, discussionRoomID, firstChoice, screenName, caseAssigned}
        screenName = data.screenName;
        console.log("[" + username + "] startDiscussion() - discussionRoomID: " + discussionRoomID + ", firstChoice: " + firstChoice + ", screenName: " + screenName + ", caseAssigned: " + caseAssigned);

        setClientState(CLIENT_STATE_DISCUSSION_STAGE);
    }

    function registerUserList(data) { //  data:[{username, firstChoice, screenName}, ...]
        var list = "";

        isAlone = (data.length == 1);
        //  It seems like lazy instantiation occurs for userList around here, which causes an error in counting the number of members in a discussion room.
        numMembers = data.length;
        console.log(numMembers);  //  to force its instantiation
        for(var i=0;i<numMembers;i++) {
            var u = data[i].username;
            var s = data[i].screenName;
            var f = parseInt(data[i].firstChoice);

            list += "<div class='students' id='student_" + i + "'>";
            list += "<span class='students_text' id='student_text_" + i + "'>" + s + "</span>&nbsp;";
            list += "<span class='students_choice_box' id='students_choice_box_" + i + "'>&nbsp;" + (f>=0 ? String.fromCharCode(CHAR_CODE_A + f) : "?") + "&nbsp;</span>";
            list += "<div class='students_flag' id='student_flag_" + i + "'>Flag This Student</div>";
            list += "</div>";

            if(u==username) {
                console.log("[" + u + "] registerUserList() - firstChoice: " + data[i].firstChoice + ", screenName: " + data[i].screenName);
                socket.emit('welcomeMessageReq', {username:username, discussionRoomID:discussionRoomID, screenName:data[i].screenName, caseAssigned:caseAssigned, firstChoice:data[i].firstChoice});
            }
        }

        $('#student_list').html(list);

        for(var i=0;i<numMembers;i++) {
            var s = data[i].screenName;
            var f = parseInt(data[i].firstChoice);

            if(f>=0)
                $('#students_choice_box_'+i).css('background-color', CHOICE_COLORS[f%CHOICE_COLORS.length]);
            else
                $('#students_choice_box_'+i).css('background-color', '#a3a3a3');

            $('#student_flag_' + i).click(function() {
                var id = parseInt($(this).attr('id').split('_')[2]);

                var msg = {username:username, quizRoomID:quizRoomID, discussionRoomID:discussionRoomID, screenName:screenName, firstChoice:firstChoice, caseAssigned:caseAssigned, message:data[id].screenName};
                socket.emit('flag', msg);
            });
        }

        if (isAlone) {
            socket.emit('broadcastAlone', {username:username, discussionRoomID:discussionRoomID, screenName:screenName, firstChoice:firstChoice, caseAssigned:caseAssigned});
        }
    }

    function showIncomingMessage(data) {  //  data:{username, quizRoomID, discussionRoomID, firstChoice, caseAssigned, message}
        if(quizRoomState!=DISCUSSION_STAGE) return;

        var speaker = "";
        var choice ="";
        var message = "";

        var message_class = "";
        var message_id = "message_" + messageCounter;

        if(username==data.username) {
            var screenNameID = parseInt(screenName.split(" ")[1]) - 1;
            speaker = "<span class='speaker' style='background-color:" + CHAT_SPEAKER_BACKGROUND_COLORS[screenNameID%CHAT_SPEAKER_BACKGROUND_COLORS.length] + ";font-weight:bold'>Me</span>: ";
            message_class = "my_message";
            message = "<span class='message'>" + data.message + "</span>";
            lastChat = new Date();
            myMessageCounter++;
            if(isAlone && myMessageCounter>0) setNextButton(DISCUSSION_STAGE, true);
        }
        else {
            if(SYSTEM_MESSAGE_SOURCE==data.username) {  //  SYSTEM MESSAGE
                speaker = "";
                message_class = "system_message";

                if(data.message==SYSTEM_WELCOME_MESSAGE) {  //  SYSTEM WELCOME MESSAGE
                    if(screenName==data.screenName) {  //  MY WELCOME MESSAGE
                        message = "<span class='message'>" + SYSTEM_MESSAGE_MY_WELCOME_PREFIX + "<span class='system_message_screen_name'>" + screenName + "</span>" + SYSTEM_MESSAGE_MY_WELCOME_POSTFIX + "<span class='system_message_firstChoice'>" + (data.firstChoice>=0 ? String.fromCharCode(CHAR_CODE_A + parseInt(data.firstChoice)) : "?") + "</span>" + ".</span>";
                    }
                    else {  //  OTHERS WELCOME MESSAGE
                        message = "<span class='message'>" + data.screenName + SYSTEM_MESSAGE_OTHERS_WELCOME + (data.firstChoice>=0 ? String.fromCharCode(CHAR_CODE_A + parseInt(data.firstChoice)) : "?") + ".</span>";
                    }
                }
                else {
                    if(parseInt(data.message)==SYSTEM_ALONE_MESSAGE) {
                        message = "<span class='message'>" + "<span class='system_message_screen_name'>" + SYSTEM_MESSAGE_ALONE + "</span>";
                    }
                    else if($.isArray(data.message) && data.message[0]==SYSTEM_DISCONNECTED_MESSAGE) {
                        var screenNameDisconnected = data.message[1];
                        message = "<span class='message'>" + "<span class='system_message_screen_name'>" + screenNameDisconnected + "</span>" + SYSTEM_MESSAGE_DISCONNECTED_POSTFIX + "</span>";
                    }
                    else if($.isArray(data.message) && data.message[0]==SYSTEM_FLAG_MESSAGE) {
                        if(screenName==data.screenName) {  //  USER WHO FLAGGED
                            var flagged = data.message[1];
                            message = "<span class='message'>" + "<span class='system_message_screen_name'>" + flagged + "</span>" + SYSTEM_MESSAGE_FLAG_POSTFIX + "</span>";
                        }
                    }
                    else {
                        if(parseInt(data.message)==SYSTEM_KEEP_TALKING_MESSAGE) {
                            lastChat = new Date();
                            if($('#message_'+(messageCounter-1)).text().indexOf(SYSTEM_MESSAGE_KEEP_TALKING_PREFIX)>=0
                                    || $('#message_'+(messageCounter-1)).text().indexOf(SYSTEM_MESSAGE_BONUS_CONDITION_PREFIX)>=0) {
                                return;
                            }
                            message = "<span class='message'>" + SYSTEM_MESSAGE_KEEP_TALKING_PREFIX + "</span>";
                        }
                        else {
                            if(parseInt(data.message)==SYSTEM_BONUS_CONDITION_MESSAGE) {
                                if($('#message_'+(messageCounter-1)).text().indexOf(SYSTEM_MESSAGE_BONUS_CONDITION_PREFIX)>=0) {
                                    return;
                                }
                                message = "<span class='message' style='font-weight:bold'>" + SYSTEM_MESSAGE_BONUS_CONDITION_PREFIX + "</span>";
                            }
                            else {
                                if(parseInt(data.message)==SYSTEM_REASONING_MESSAGE) {

                                    message = "<span class='message' style='font-weight:bold'>" + SYSTEM_MESSAGE_REASONING_PREFIX + "</span>";
                                }
                                else {
                                    if(parseInt(data.message)==SYSTEM_QUIT_REQ_MESSAGE) {
                                        numDiscussionQuitReq++;
                                        message = "<span class='message' style='font-weight:bold'>" + data.screenName + "</span>" + SYSTEM_MESSAGE_QUIT_REQ_POSTFIX + " (" + numDiscussionQuitReq + "/" + numMembers + ").";
                                    }
                                    else {
                                        if(parseInt(data.message)==SYSTEM_QUIT_CANCEL_MESSAGE) {
                                            numDiscussionQuitReq--;
                                            message = "<span class='message' style='font-weight:bold'>" + data.screenName + "</span>" + SYSTEM_MESSAGE_QUIT_CANCEL_POSTFIX + " (" + numDiscussionQuitReq + "/" + numMembers + ").";
                                        }
                                        else {
                                            if(parseInt(data.message)==SYSTEM_QUIT_MESSAGE) {
                                                discussionQuitAgreed = true;
                                                $('#next_button').click();
                                            }
                                            else {

                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {  //  OTHER USER MESSAGE
                var screenNameID = parseInt(data.screenName.split(" ")[1]) - 1;
                speaker = "<span class='speaker' style='background-color:" + CHAT_SPEAKER_BACKGROUND_COLORS[screenNameID%CHAT_SPEAKER_BACKGROUND_COLORS.length] + "'>" + data.screenName + "</span>: ";
                message_class = "others_message"
                    message = "<span class='message'>" + data.message + "</span>";
                lastChat = new Date();
            }
        }

        $("#messages").append("<div class='"+message_class+"' id='"+message_id+"'>&nbsp;" + speaker + message + "</div>");

        scrollPosition+=SCROLL_SPEED;
        $("#messages").scrollTop(scrollPosition);
        $("#messages").scrollLeft(0);
        messageCounter++;
    }

    function stopTimer() { timerControlStopped = true; /* Not working right now */}

    function resumeTimer() { timerControlStopped = false; }

    function timerToThree() { timeLimits[quizRoomState] = 3; timerEnds[quizRoomState] = getTimerEnd(timeLimits[quizRoomState]); }

    function correctAnswerReq() {
        updateCorrectAnswer(quiz.correctAnswer);
        // socket.emit('correctAnswerReq', quiz.number);
    }

    function updateCorrectAnswer(answer) {
        correctAnswer = answer;
    }

    function finalSubmission(submission) {  //  submission:{username, quizRoomID, discussionRoomID, firstChoice, finalChoice}
        console.log("[" + submission.username + "] finalSubmission() - discussionRoomID: " + submission.discussionRoomID + ", firstChoice: " + submission.firstChoice + ", finalChoice: " + submission.finalChoice);
        quizCounter++;
        socket.emit('finalSubmission', submission);
    }

    function postSurvey(data) {
        console.log("Displaying final survey");

        var survey = data.postSurvey;

        showUI('wait_ui', false);

        var surveyDiv = "<div id='survey_container'><p><b>You must complete the survey in order to be paid.</b></p>";

        for(var i=0;i<survey.length;i++) {
            surveyDiv += "<table class='survey_question_tables' id='survey_question_table_" + i + "'>"

                if(survey[i].surveyChoices.length>0) {  //  MULTIPLE CHOICE QUESTION
                    surveyAnswers[i] = -1;  //  UNANSWERED
                    surveyDiv += "<tr>"
                        surveyDiv += "<td class='survey_questions' rowspan='2'>" + (survey[i].number+1) + ". " + survey[i].serveyQuestion + "</td>";
                    for(var j=0;j<survey[i].surveyChoices.length;j++) {
                        surveyDiv += "<td class='survey_choice_labels' id='survey_choice_label_" + i + "_" + j + "'>" + survey[i].surveyChoices[j] + "</td>";
                    }
                    surveyDiv += "</tr><tr>";
                    for(var j=0;j<survey[i].surveyChoices.length;j++) {
                        surveyDiv += "<td class='survey_choices' id='survey_choice_" + i + "_" + j + "'>";
                        surveyDiv += "<div class='survey_choice_boxes' id='answer_" + i + "_" + j + "'></div>";
                        surveyDiv += "</td>";
                    }
                    surveyDiv += "</tr>";
                }
                else {
                    surveyDiv += "<tr>"
                        surveyDiv += "<td class='survey_questions'>" + (survey[i].number+1) + ". " + survey[i].serveyQuestion + "</td>";
                    surveyDiv += "<td class='survey_writings'>" + "<textarea id='answer_" + i + "' rows='6' cols='50'></textarea> " + "</td>";
                    surveyDiv += "</tr>"
                }

            surveyDiv += "</table>";
        }

        surveyDiv += "<div class='button button-rounded button-flat-primary' id='survey_submit_button'>Submit</div>";
        surveyDiv += "</div>";
        $('#content').html(surveyDiv);

        //  STYLING SURVEY DOM OBJECTS
        for(var i=0;i<survey.length;i++) {
            for(var j=0;j<survey[i].surveyChoices.length;j++) {
                if(jQuery.type($('#answer_'+i+'_'+j)) === "undefined") {  //  WRITING QUESTION

                }
                else {
                    $('#survey_choice_label_'+i+'_'+j).css('width', ($('#survey_question_table_'+i).width()*0.6)/survey[i].surveyChoices.length);
                    $('#survey_choice_'+i+'_'+j).css('width', ($('#survey_question_table_'+i).width()*0.6)/survey[i].surveyChoices.length);
                    $('#answer_'+i+'_'+j).css('background-color', CHOICE_COLORS[j%CHOICE_COLORS.length]);
                    $('#answer_'+i+'_'+j).css('margin-left', ((($('#survey_question_table_'+i).width()*0.6)/survey[i].surveyChoices.length)-20)/2);
                }
            }
        }

        //  EVENT LISTENERS
        $('.survey_choice_boxes').click(function() {
            var qIndex = parseInt($(this).attr('id').split('_')[1]);
            var answer = parseInt($(this).attr('id').split('_')[2]);

            if(surveyAnswers[qIndex]<0) {  //  INITIAL CHOICE
                $(this).html(CHECK_IMG);
                surveyAnswers[qIndex] = answer;
            }
            else {
                if(surveyAnswers[qIndex]==answer) {  //  CANCEL THE EXISTING CHOICE
                    $(this).html("");
                    surveyAnswers[qIndex] = -1;
                }
                else {  //  CHANGE THE CHOICE
                    $('#answer_'+qIndex+'_'+surveyAnswers[qIndex]).html("");
                    $(this).html(CHECK_IMG);
                    surveyAnswers[qIndex] = answer;
                }
            }

            for(var i=0;i<surveyAnswers.length;i++) {
                console.log((i+1) + ": " + surveyAnswers[i]);
            }
        });

        $('#survey_submit_button').click(function() {
            if(surveyAnswers.indexOf(-1)>=0) {
                alert("Please answer all of the questions.");
                return;
            }
            else {
                for(var i=0;i<survey.length;i++) {
                    if(survey[i].surveyChoices.length>0) {  //  MULTIPLE CHOICE QUESTION

                    }
                    else {  //  WRITING QUESTION
                        surveyAnswers[i] = $('#answer_'+i).val();
                    }
                }
                socket.emit('surveySumission', {username:username, surveyAnswers:surveyAnswers});
                // finish();
            }
        });
    }

    // SurveyMonkey does not accept all characters, so some need replacing
    // This can result in name collisions but they're expected to be very rare
    function normalize_for_surveymonkey(name) {
        name = name.replace(/ /g, '_');
        name = name.replace(/#/g, '-');
        name = name.replace(/&/g, '-');
        name = name.replace(/'/g, '-');
        return name;
    }

    function finish(msg) {
        // socket.disconnect();
        location.replace("https://www.surveymonkey.com/s/YGGRZ92?c=" + normalize_for_surveymonkey(username));
        // console.log("Displaying final HIT submission screen");
        // showUI('wait_ui', false);
        // showUI('quiz_ui', false);
        // showUI('discussion_ui', false);
        // showUI('warning_ui', false)
        // showUI('login_ui', false)
        // showUI('survey_container', false)

        // document.getElementById('assignmentId').value = gup('assignmentId');
        // document.getElementById('workerId').value = gup('workerId');
        // document.getElementById('hitId').value = gup('hitId');
        // document.getElementById('mturk_form').action = decodeURIComponent(gup('turkSubmitTo')) + '/mturk/externalSubmit';

        // showUI('submit_hit_ui', true)
    }

    //  START UI FUNCTIONS
    function showUI(ui_class, show) {
        if(show) {
            $('.' + ui_class).css('display', 'block');
        } else {
            $('.' + ui_class).css('display', 'none');
        }
    }

    function showQuiz() {
        var number = quiz.number;
        var question = quiz.question;
        var imageURL = quiz.imageURL;
        var choices = quiz.choices;

        $('#question').html("<em>Question" + "</em>" + question);
        $('#image').html("");
        if(quiz.imageURL!="") $('#image').html("<img src='" + imageURL + "' style='max-width:100%'/>");
        $('#choice_from').html(String.fromCharCode(CHAR_CODE_A));
        $('#choice_to').html(String.fromCharCode(CHAR_CODE_A + choices.length - 1));
        var c = "<p id='choice_title'>Possible Answers</p>";
        for(var i=0;i<choices.length;i++) {
            c += "<div class='choice_container' id='choice_container_" + i + "'>";
            c += "<div class='choice_box' id='choice_box_" + i + "'>" + String.fromCharCode(CHAR_CODE_A + i) + "</div>";
            c += "<div class='choice' id='choice_" + i + "'>";
            c += choices[i];
            c += "</div>";
            c += "</div>";
        }
        $('#choices').html(c);
        applyChoicesBasicStyle(choices.length);
        addChoicesEventListener(choices.length);
    }

    function applyChoicesBasicStyle(numChoices) {
        for(var i=0;i<numChoices;i++) {
            $('#choice_box_'+i).css('background-color', CHOICE_COLORS[i%CHOICE_COLORS.length]);
        }
    }

    function addChoicesEventListener(numChoices) {
        for(var i=0;i<numChoices;i++) {

            $('#choice_container_'+i).mouseenter(function(e) {
                if(!choicesEnabled) return;
                var id = $(this).attr('id').split('_')[2];
                $('#choice_'+id).css('background-color', CHOICE_SHADOW_COLORS[id%CHOICE_COLORS.length]);
            });

            $('#choice_container_'+i).mouseleave(function(e) {
                if(!choicesEnabled) return;
                var id = $(this).attr('id').split('_')[2];
                $('#choice_'+id).css('background-color', '#ffffff');
            });

            $('#choice_container_'+i).click(function(e) {
                if(!choicesEnabled) return;
                var id = parseInt($(this).attr('id').split('_')[2]);

                if(quizRoomState==FIRST_CHOICE_STAGE) {
                    if(firstChoice<0) {  //  INITIAL CHOICE
                        $('#choice_'+id).css('border', '1px solid ' + CHOICE_COLORS[id%CHOICE_COLORS.length]);
                        $('#choice_box_'+id).html(CHECK_IMG);
                        firstChoice = id;
                        setNextButton(quizRoomState, true);

                        //  SET REMINDER
                        $('#first_choice_reminder').html("<div class='reminder_choice_box' id='reminder_first_choice_box_" + id + "'>" + String.fromCharCode(CHAR_CODE_A + id) + "</div>" + "<div class='reminder_text'>" + CURRENT_CHOICE_REMINDER_PREFIX + "</div>");
                        $('#reminder_first_choice_box_' + id).css('background-color', CHOICE_COLORS[id%CHOICE_COLORS.length]);
                    }
                    else {
                        if(firstChoice==id) {  //  CANCEL EXISTING CHOICE
                            $('#choice_'+firstChoice).css('border', '0px');
                            $('#choice_box_'+firstChoice).html(String.fromCharCode(CHAR_CODE_A + id));
                            firstChoice = -1;
                            setNextButton(quizRoomState, false);

                            //  SET REMINDER
                            $('#first_choice_reminder').html('');
                        }
                        else {  //  CHANGE CHOICE
                            $('#choice_'+firstChoice).css('border', '0px');
                            $('#choice_box_'+firstChoice).html(String.fromCharCode(CHAR_CODE_A + firstChoice));
                            $('#choice_'+id).css('border', '1px solid ' + CHOICE_COLORS[id%CHOICE_COLORS.length]);
                            $('#choice_box_'+id).html(CHECK_IMG);
                            firstChoice = id;
                            setNextButton(quizRoomState, true);

                            //  SET REMINDER
                            $('#first_choice_reminder').html("<div class='reminder_choice_box' id='reminder_first_choice_box_" + id + "'>" + String.fromCharCode(CHAR_CODE_A + id) + "</div>" + "<div class='reminder_text'>" + CURRENT_CHOICE_REMINDER_PREFIX + "</div>");
                            $('#reminder_first_choice_box_' + id).css('background-color', CHOICE_COLORS[id%CHOICE_COLORS.length]);
                        }
                    }
                }
                else {  //  DISCUSSION_STAGE AND FINAL CHOICE STAGE
                    if(finalChoice<0) {  // NEITHER FIRST CHOICE NOR FINAL CHOICE
                        $('#choice_'+id).css('border', '1px solid ' + CHOICE_COLORS[id%CHOICE_COLORS.length]);
                        $('#choice_box_'+id).html(CHECK_IMG);
                        finalChoice = id;
                        finalChoiceClicked = true;
                        if(quizRoomState==FINAL_CHOICE_STAGE) setNextButton(quizRoomState, true);

                        //  SET REMINDER
                        $('#final_choice_reminder').html("<div class='reminder_choice_box' id='reminder_final_choice_box_" + id + "'>" + String.fromCharCode(CHAR_CODE_A + id) + "</div>" + "<div class='reminder_text'>" + FINAL_CHOICE_REMINDER_PREFIX + "</div>");
                        $('#reminder_final_choice_box_' + id).css('background-color', CHOICE_COLORS[id%CHOICE_COLORS.length]);
                    }
                    else {  //  EITHER FIRST CHOICE OR FINAL CHOICE EXISTS
                        if(finalChoice==id) { //  CANCEL EXISTING CHOICE
                            if(!finalChoiceClicked) { //  CANCEL FIRST CHOICE
                                $('#choice_'+firstChoice).css('border', '0px');
                                $('#choice_box_'+firstChoice).html(String.fromCharCode(CHAR_CODE_A + id));
                                finalChoice = -1;
                                if(quizRoomState==FINAL_CHOICE_STAGE) setNextButton(quizRoomState, false);

                                //  SET REMINDER
                                $('#final_choice_reminder').html('');
                            }
                            else {  //  CANCEL FINAL CHOICE
                                $('#choice_'+id).css('border', '0px');
                                $('#choice_box_'+id).html(String.fromCharCode(CHAR_CODE_A + id));
                                finalChoice = -1;
                                if(quizRoomState==FINAL_CHOICE_STAGE) setNextButton(quizRoomState, false);

                                //  SET REMINDER
                                $('#final_choice_reminder').html('');
                            }
                        }
                        else {
                            $('#choice_'+finalChoice).css('border', '0px');
                            $('#choice_box_'+finalChoice).html(String.fromCharCode(CHAR_CODE_A + finalChoice));
                            $('#choice_'+id).css('border', '1px solid ' + CHOICE_COLORS[id%CHOICE_COLORS.length]);
                            $('#choice_box_'+id).html(CHECK_IMG);
                            finalChoice = id;
                            finalChoiceClicked = true;
                            if(quizRoomState==FINAL_CHOICE_STAGE) setNextButton(quizRoomState, true);

                            //  SET REMINDER
                            $('#final_choice_reminder').html("<div class='reminder_choice_box' id='reminder_final_choice_box_" + id + "'>" + String.fromCharCode(CHAR_CODE_A + id) + "</div>" + "<div class='reminder_text'>" + FINAL_CHOICE_REMINDER_PREFIX + "</div>");
                            $('#reminder_final_choice_box_' + id).css('background-color', CHOICE_COLORS[id%CHOICE_COLORS.length]);
                        }
                    }
                }
            });
        }
    }

    function setTimer(state) {
        timeLimits = quiz.timeLimits;
        if (typeof timerEnds == 'undefined') {
            // Initialize size with clone
            timerEnds = timeLimits.slice(0);
        }
        timerEnds[state] = getTimerEnd(timeLimits[state]);
        if(TIMER_ON[state]) {
            timer = setInterval(function() {
                timeLimits[state] = secondsRemaining(timerEnds[state]);
                if(state==FINAL_CHOICE_STAGE) $('#timer_label').css('color', '#e54028');
                else $('#timer_label').css('color', 'black');

                $('#timer_label').html('Timer<br />' + getMinute(timeLimits[state])+' : '+getSecond(timeLimits[state]));

                if(timeLimits[state]<0) {
                    $('#timer_label').html('Timer<br />00 : 00');
                    $('#next_button').click();
                }

                if(state==DISCUSSION_STAGE && discussionRoomID.indexOf(username)>=0) {
                    var now = new Date();
                    var elapsedSinceLastChat = Math.floor((now.getTime() - lastChat.getTime())/1000);
                    if(elapsedSinceLastChat>=SILENCE_LIMIT) {
                        lastChat = new Date();
                        socket.emit('silence', {username:username, discussionRoomID:discussionRoomID, screenName:screenName, firstChoice:firstChoice, caseAssigned:caseAssigned});
                    }
                }
            }, ONE_SECOND);
        }
    }

    function setNextButton(state, enabled) {
        nextButtonEnabled = enabled;
        $('#next_button_label').html(NEXT_BUTTON_LABELS[state]);

        if(enabled) {
            $('#next_button').css('color', BUTTON_LABEL_COLORS[1]);
            $('#next_button').attr('class', NEXT_BUTTON_CLASSES[state]);
        }
        else {
            $('#next_button').css('color', BUTTON_LABEL_COLORS[0]);
            $('#next_button').attr('class', NEXT_BUTTON_DISABLED_CLASSES[state]);
        }
    }

    function setSendButton(enabled) {
        sendButtonEnabled = enabled;

        if(enabled) {
            $('#send').css('color', BUTTON_LABEL_COLORS[1]);
            $('#send').attr('class', SEND_BUTTON_CLASS);
        }
        else {
            $('#send').css('color', BUTTON_LABEL_COLORS[0]);
            $('#send').attr('class', SEND_BUTTON_DISABLED_CLASS);
        }
    }

    function setWaitingMessage(state) {
        $('#wait_message').html(WAITING_MESSAGES[state+1]);
    }

    function setContextualInstruction(state) {
        $('#contextual_notice').html(CONTEXTUAL_NOTICES[state]);
        $('#contextual_notice').scrollTop(0);
    }

    function emphasizeInstruction(duration) {
        $('#contextual_notice').css('font-weight', 'bold');
        emphasizingTimer = setTimeout(function() {
            $('#contextual_notice').css('font-weight', 'normal');
        }, duration);
    }

    function getMinute(sec) { return Math.floor(sec/60)<10 ? "0"+Math.floor(sec/60) : Math.floor(sec/60); }

    function getSecond(sec) { return sec%60<10 ? "0"+sec%60 : sec%60; }
    //  END UI FUNCTIONS

    function setClientState(state) {

        switch(state) {
            case CLIENT_STATE_IDLE:

                break;

            case CLIENT_STATE_QUIZ_WAITLIST:
                setWaitingMessage(quizRoomState);

                break;

            case CLIENT_STATE_FIRST_CHOICE_STAGE:
                //  SET STATE VARIABLES
                quizRoomState = FIRST_CHOICE_STAGE;

                //  RESET GLOBALVARIABLES
                firstChoice = -1;
                finalChoice = -1;
                correctAnswer = -1;
                choicesEnabled = true;
                finalSubmitButtonClicked = false;

                //  SET UI
                $('#quiz_container').scrollTop(0);
                showUI('login_ui', false);
                showUI('wait_ui', false);
                showUI('quiz_ui', true);
                showUI('warning_ui', true);
                $('#first_choice_reminder').empty();
                $('#final_choice_reminder').empty();
                $('#final_choice_warning').css('text-align', 'center');
                $('#final_choice_warning').css('font-size', '30px');
                $('#final_choice_warning').css('color', '#e54028');
                $('#final_choice_warning').css('overflow', 'hidden');
                $('#final_choice_warning').css('font-family', '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif');

                // if(bonusCondition==0)
                //   $('#final_choice_warning').html(WARNING_MESSAGE_FIRST_CHOICE_STAGE_WITHOUT_BONUS);

                // if(bonusCondition==1)
                //   $('#final_choice_warning').html(WARNING_MESSAGE_FIRST_CHOICE_STAGE_WITH_BONUS);

                showQuiz();
                setWaitingMessage(FIRST_CHOICE_STAGE);
                setContextualInstruction(FIRST_CHOICE_STAGE);
                setNextButton(FIRST_CHOICE_STAGE, false);
                setTimer(FIRST_CHOICE_STAGE);
                break;

            case CLIENT_STATE_DISCUSSION_WAITLIST:
                setWaitingMessage(FIRST_CHOICE_STAGE);
                break;

            case CLIENT_STATE_DISCUSSION_STAGE:
                //  SET STATE VARIABLES
                quizRoomState = DISCUSSION_STAGE;

                //  RESET GLOBALVARIABLES
                finalChoice = firstChoice;
                messageCounter = 0;
                myMessageCounter = 0;
                scrollPosition = 0;
                lastChat = new Date();
                finalChoiceClicked = false;
                numDiscussionQuitReq = 0;
                discussionQuitReq = true;
                discussionQuitAgreed = false;

                //  SET UI
                showUI('wait_ui', false);
                showUI('discussion_ui', true);
                showUI('warning_ui', false);

                setWaitingMessage(DISCUSSION_STAGE);
                setContextualInstruction(DISCUSSION_STAGE);
                setNextButton(DISCUSSION_STAGE, true);
                setSendButton(true);
                setTimer(DISCUSSION_STAGE);

                //  SET REMINDER WITHOUT FIRST CHOICE
                if(firstChoice<0) {
                    $('#first_choice_reminder').html("<div class='reminder_choice_box' id='reminder_first_choice_box_" + firstChoice + "'>" + "?" + "</div>" + "<div class='reminder_text'>" + NO_FIRST_CHOICE_REMINDER_PREFIX + "</div>");
                    $('#reminder_first_choice_box_' + firstChoice).css('background-color', '#a3a3a3');
                }

                var reminder = $('#first_choice_reminder').html();
                reminder = reminder.replace(CURRENT_CHOICE_REMINDER_PREFIX, FIRST_CHOICE_REMINDER_PREFIX);
                $('#first_choice_reminder').html(reminder);

                //  RESET UI
                $('#messages').empty();
                $('#outgoing-message').val('');
                $('#outgoing-message').focus();
                break;

            case CLIENT_STATE_FINAL_CHOICE_STAGE:
                //  SET STATE VARIABLES
                quizRoomState = FINAL_CHOICE_STAGE;

                //  RESET GLOBALVARIABLES
                correctAnswerReq();

                //  SET UI
                showUI('discussion_ui', false);
                showUI('warning_ui' , true);

                setWaitingMessage(FINAL_CHOICE_STAGE);
                setContextualInstruction(FINAL_CHOICE_STAGE);
                setSendButton(false);
                setTimer(FINAL_CHOICE_STAGE);
                $('#final_choice_warning').html(WARNING_MESSAGE_FINAL_CHOICE_STAGE);

                if(finalChoice<0) {
                    $('#final_choice_reminder').html("<div class='reminder_choice_box' id='reminder_final_choice_box_" + finalChoice + "'>" + "?" + "</div>" + "<div class='reminder_text'>" + NO_FINAL_CHOICE_REMINDER_PREFIX + "</div>");
                    $('#reminder_final_choice_box_' + finalChoice).css('background-color', '#a3a3a3');
                    setNextButton(FINAL_CHOICE_STAGE, false);
                }
                else {
                    $('#final_choice_reminder').html("<div class='reminder_choice_box' id='reminder_final_choice_box_" + finalChoice + "'>" + String.fromCharCode(CHAR_CODE_A + finalChoice) + "</div>" + "<div class='reminder_text'>" + FINAL_CHOICE_REMINDER_PREFIX + "</div>");
                    $('#reminder_final_choice_box_' + finalChoice).css('background-color', CHOICE_COLORS[finalChoice%CHOICE_COLORS.length]);
                    setNextButton(FINAL_CHOICE_STAGE, true);
                }

                break;

            case CLIENT_STATE_EXPLANATION_STAGE:
                //  SET STATE VARIABLES
                quizRoomState = EXPLANATION_STAGE;

                //  RESET GLOBALVARIABLES
                choicesEnabled = false;

                //  SET UI
                setNextButton(EXPLANATION_STAGE, true);
                $('#final_choice_warning').css('text-align', 'left');
                $('#final_choice_warning').css('font-size', '14px');
                $('#final_choice_warning').css('color', 'black');
                $('#final_choice_warning').css('font-family', '"Lucida Sans Unicode", "Lucida Grande", sans-serif');
                $('#final_choice_warning').css('overflow', 'scroll');
                $('#final_choice_warning').html("&emsp;The correct answer is <span id='popup_choice_box' style='background-color:" + CHOICE_COLORS[correctAnswer%CHOICE_COLORS.length] + "'>&nbsp;" + String.fromCharCode(CHAR_CODE_A + correctAnswer) + "&nbsp;</span>.<br /><br />");
                $('#final_choice_warning').append("Explanation<br />" + quiz.explanation);

                setContextualInstruction(EXPLANATION_STAGE);
                setTimer(EXPLANATION_STAGE);

                break;
        }


        clientState = state;

        if(clientState==CLIENT_STATE_IDLE) {

        }
        else {
            if(clientState==CLIENT_STATE_QUIZ_WAITLIST) {
            }
            else {
                if(clientState==CLIENT_STATE_FIRST_CHOICE_STAGE) {
                }
                else {
                    if(clientState==CLIENT_STATE_DISCUSSION_WAITLIST) {
                    }
                    else {
                        if(clientState==CLIENT_STATE_DISCUSSION_STAGE) {
                        }
                        else {
                            if(clientState==CLIENT_STATE_FINAL_CHOICE_STAGE) {
                            }
                            else {
                                if(clientState==CLIENT_STATE_EXPLANATION_STAGE) {
                                }
                                else {
                                    //  UNEXPECTED STATE
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    }

    //  START
    if (parent) {
        if(window.addEventListener) {
            window.addEventListener('load', init, false);
        } else if(window.attachEvent) {
            window.attachEvent('onload', init);
        }
    } else {
        $(document).ready(function() {
            init();
        });
    }

    // TODO
    // at the start of the session, before they begin, tell them how many questions they will be answering in total
    // option to just read the questions instead of doing the chat needs to be put into edX
