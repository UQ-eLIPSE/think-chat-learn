/// <reference path="./settings.js" />
/// <reference path="./moocchat-utilities.js" />
/// <reference path="./moocchat.js" />
/// <reference path="./stateflow.js" />

/**
 * MOOCchat: state-based code
 * 
 * This holds the new state-based MOOCchat page flow.
 * This is not self-contained: the old code is still required, though
 * parts of it are now turned off. This includes global variables which
 * are defined in ./moocchat.js.
 * 
 * Intended to replace page + stage combination which was used previously
 * to streamline the workflow and make it easier to work with.
 */

// Executes on DOM ready
$(function() {
    /**
     * Workflow states
     */
    var _STATE = {
        INTRODUCTION: 0,
        LOGIN: 1,
        LOGIN_FAILED: 2,
        LOGIN_QUIZ_ALREADY_DONE: 3,
        AWAIT_GROUP_FORMATION: 4,
        QUIZ: 5,
        AWAIT_QUIZ_DISCUSSION_ROOM: 6,
        QUIZ_DISCUSSION: 7,
        QUIZ_REVISION: 8,
        QUIZ_EXPLANATION: 9,
        SURVEY: 10,
        SURVEY_COMPLETION: 11
    }

    /**
     * Page IDs
     */
    var _PAGE = {
        PREVIEW_PAGE: "#preview-page",
        LOGIN_PAGE: "#login-page",
        CONSENT_PAGE: "#consent-page",
        WAIT_PAGE: "#wait-page",
        LEARNING_PAGE: "#learning-page",
        MAIN_TASK_PAGE: "#main-task-page",
        IDLE_PAGE: "#idle-page",
        POST_SURVEY_PAGE: "#post-survey-page",
        SUBMIT_HIT_PAGE: "#submit-hit-page",
        COMPLETED_PAGE: "#completed-page",
        ALREADY_DONE_PAGE: "#already-done-page",
        INVALID_LOGIN: "#login-invalid"
    }

    /**
     * Returns $/jQuery of the selector within the context of
     * StateFlow.getRootElem()
     * 
     * @return {jQuery}
     */
    function page$(selector) {
        return $(selector, StateFlow.getRootElem());
    }

    /**
     * Taken out of the section at the start of updatePage().
     * 
     * Returns the username that is in the form (remember that
     * the "login" page is still available to be manipulated,
     * but is generally out of sight in most states)
     * 
     * ***  Should only be used after the LOGIN state because   ***
     * ***  this depends on the value in the form field!        ***
     */
    function getUserName() {
        if (SINGLE_SIGN_ON == true) {
            return page$('#username').val();
        }
    }

    /**
     * Replacement for pauseGroupTimer() in the old code.
     * 
     * This actually does what it says - pauses the group timer.
     * The old function lied - it TOGGLED! >:(
     */
    function pauseGroupTimer() {
        paused = true;
    }

    /**
     * Performs updating of the main task page - brought out
     * from the old code (under updatePage() -> MAIN_TASK_PAGE)
     */
    function renderMainTaskPage() {
        console.log(MAIN_TASK_PAGE + ": stage " + stage);
        socket.emit('user_flow', { username: getUserName(), timestamp: new Date().toISOString(), page: 'Main Task Page', event: '' });
        page$(".moocchat-conditional").addClass("hidden"); //  HIDE ALL THE CONDITIONAL ELEMENTS
        // $(".moocchat-control-panel").removeClass("hidden"); //  SHOW THE CONTROL PANEL

        // Hardcoded conditions as on server
        conditionAssigned = 0;  // For our MOOCchat, we only have 1 condition that is set in the server
        conditionSet = {
            "discussion": [
                "moocchat-discussion-high"
            ]
        };
        
        // TODO: These two need to be reworked to remove the reliance on stage 
        resetStage(conditionAssigned, stage);
        renderStage(conditionNames, stageName);
    }

    /**
     * Used for backwards compatibility with existing code.
     * This shouldn't be necessary once the state-based flow is fully implemented.
     */
    function setStageAndPage(stageId, pageId) {
        stage = stageId;
        currentPage = pageId;
    }

    //  ========================================



    //  STARTING POINT
    startClock();

    //  CONNECT TO NODE SERVER
    socket = connect();

    // Build up states
    StateFlow.registerAll([
        {   // _STATE.INTRODUCTION
            state: _STATE.INTRODUCTION,
            page: _PAGE.WAIT_PAGE,
            onEnter: function() {
                page$("#moocchat-start-button").click(function(e) {
                    StateFlow.goTo(_STATE.LOGIN);
                });
            }
        },
        {   // _STATE.LOGIN
            state: _STATE.LOGIN,
            page: _PAGE.LOGIN_PAGE,
            onEnter: function() {
                // Socket callbacks

                /**
                 * Previously loginFailed().
                 */
                function loginFail() {
                    StateFlow.goTo(_STATE.LOGIN_FAILED);
                }

                /**
                 * Previously loginExistingUser().
                 */
                function loginAlreadyDidQuiz() {
                    StateFlow.goTo(_STATE.LOGIN_QUIZ_ALREADY_DONE);
                }

                /**
                 * Previously startTask().
                 * 
                 * Stores basic information about the user and quiz
                 * once login is okay.
                 */
                function loginSuccess(data) {
                    username = data.username;
                    if (data) {
                        quiz = data.quiz;
                    }
                    else {
                        console.log('ERROR: couldn\'t get quiz data');
                        return;
                    }

                    StateFlow.goTo(_STATE.QUIZ);
                }

                // Initialisation
                function setupSockets() {
                    socket.once("loginFailure", loginFail);
                    socket.once("loginExistingUser", loginAlreadyDidQuiz);
                    socket.once("loginSuccess", loginSuccess);
                }

                function initPage() {
                    // Brought out from updatePage() -> LOGIN_PAGE
                    console.log(LOGIN_PAGE);

                    $.removeCookie(COOKIE_USERNAME, { path: "/" });  //  TO BE REMOVED

                    if (getUserName()) {
                        //UQ Single Sign On
                        $.cookie(COOKIE_USERNAME, getUserName(), { path: "/" });
                    }

                    //----//

                    page$("#login-button").click(function(e) {  //  login button is clicked
                        if (!isCookieSet) {
                            // No String.trim in IE - see http://stackoverflow.com/questions/3439316/ie8-and-jquerys-trim
                            username = $.trim(page$("#username").val());
                        }
                        if (username == "") return;
                        console.log(username);
                        $.cookie(COOKIE_USERNAME, username, { path: "/" }); // TO REMOVE COOKIE: $.removeCookie(COOKIE_USERNAME, {path:"/"});
                        isCookieSet = true;
                        page$("#username").blur();
                        socket.emit('login_req', { username: username, password: "ischool", turkHitId: turkHitId, browserInformation: navigator.userAgent });
                    });

                    page$("#username").keydown(function(e) {
                        if (e.which != ENTER_KEY_CODE) return;
                        page$("#login-button").click();
                    });

                    if ($.cookie(COOKIE_USERNAME) != null) {
                        isCookieSet = true;
                        username = $.cookie(COOKIE_USERNAME);
                        socket.emit('user_flow', { username: username, timestamp: new Date().toISOString(), page: 'Logged In - Wait Page', event: "" });

                        if (isCookieSet) page$("#login-button").click();
                    }

                    page$("#username").focus();
                }

                setStageAndPage(null, LOGIN_PAGE);
                setupSockets();
                initPage();
            },
            onLeave: function() {
                socket.off("loginFailure");
                socket.off("loginExistingUser");
                socket.off("loginSuccess");
            }
        },
        {   // _STATE.LOGIN_FAILED
            state: _STATE.LOGIN_FAILED,
            page: _PAGE.INVALID_LOGIN,
            onEnter: function() {
                // Brought out from updatePage() -> INVALID_LOGIN
                socket.emit('user_flow', { username: getUserName(), timestamp: new Date().toISOString(), page: 'Invalid Login Page', event: '' });
                console.log(INVALID_LOGIN);
            }
        },
        {   // _STATE.LOGIN_QUIZ_ALREADY_DONE
            state: _STATE.LOGIN_QUIZ_ALREADY_DONE,
            page: _PAGE.ALREADY_DONE_PAGE
        },
        {   // _STATE.AWAIT_GROUP_FORMATION
            state: _STATE.AWAIT_GROUP_FORMATION,
            page: _PAGE.IDLE_PAGE,
            onEnter: function(incomingStateData) {
                // Socket callbacks

                /**
                 * Previously updateQuizWaitlistReq().
                 * 
                 * Stores info about quiz group.
                 * Returns a new request to server to indicate updated waitlist.
                 */
                function quizGroupFormed(data) {  //  data:{username, quizRoomID, questionNumber, conditionAssigned, conditionSet, numMembers}
                    quizRoomID = data.quizRoomID;
                    questionNumber = data.questionNumber;
                    numMembers = data.numMembers;
                    conditionAssigned = data.conditionAssigned;
                    conditionSet = data.conditionSet;

                    console.log("[" + username + "] updateQuizWaitlistReq() - quizRoomID: " + quizRoomID);
                    socket.emit('updateQuizWaitlistReq', { username: username, quizRoomID: quizRoomID });
                }

                /**
                 * Previously joinQuizRoomReq().
                 * 
                 * Fires requests to join quiz room.
                 */
                function quizWaitlistUpdated(data) { //  data:{username, quizRoomID}
                    console.log("[" + username + "] joinQuizRoomReq() - quizRoomID: " + quizRoomID);
                    socket.emit('joinQuizRoomReq', data);
                }

                /**
                 * Previously quizReq().
                 * 
                 * Sends two frames:
                 *  - quizReq
                 *  - finishedReading
                 */
                function quizRoomJoined(data) {   //  data:{username, quizRoomID}
                    console.log("[" + username + "] quizReq() - quizRoomID: " + quizRoomID);
                    socket.emit('quizReq', data);
                    socket.emit("finishedReading", { username: username, quizRoomID: quizRoomID, promptResp: promptResp });
                }

                /**
                 * Previously startQuiz().
                 * 
                 * Set up quiz when quiz request okay
                 */
                function quizRequestAccepted(data) {  //  data:{username, quizRoomID, quiz);
                    console.log("[" + username + "] startQuiz() - quizRoomID: " + quizRoomID);
                    clearInterval(quizWaitTimer);
                    // quiz = data.quiz;
                    var maxChoices = quiz['maxChoiceForStudentGenerateQuestion'];
                    for (var i = 0; i < maxChoices; i++) {
                        moocchatChoicesClicked.push(-1);
                    }
                    // goToPage(MAIN_TASK_PAGE);
                }

                /**
                 * Previously receivePromptResp().
                 * 
                 * Saves prompts and requests userlist for group
                 */
                function receivePromptResponse(data) {
                    promptResps = data;
                    console.log(promptResps);
                    socket.emit("userListReq", { username: username, quizRoomID: quizRoomID });
                }

                /**
                 * Previously from receiveUserList() outside of this block.
                 * 
                 * Processes list of users in group, and proceeds to next state (displaying quiz)
                 */
                function receiveUserList(data) {
                    userList = data;
                    console.log(userList);
                    for (var i = 0; i < userList.length; i++) {
                        var user = userList[i];
                        if (user["username"] == username) {
                            screenName = user["screenName"];
                        }
                    }

                    // Pass the incoming data along as part of the delayed answer submission
                    StateFlow.goTo(_STATE.AWAIT_QUIZ_DISCUSSION_ROOM, incomingStateData);
                }

                function setupSockets() {
                    socket.once("groupedForQuiz", quizGroupFormed);
                    socket.once("quizWaitlistUpdated", quizWaitlistUpdated);
                    socket.once("joinedForQuiz", quizRoomJoined);

                    // TODO: Once or Always?
                    //       I remember seeing this being fired multiple times... 
                    socket.once("quiz", quizRequestAccepted);
                    socket.once("promptResps", receivePromptResponse);

                    socket.once("userList", receiveUserList);
                }

                function initPage() {
                    // Stop the main quiz timer (the one for questions, NOT the waiting one)
                    clearInterval(mainTimer);
                    
                    socket.emit('user_flow', { username: getUserName(), timestamp: new Date().toISOString(), page: 'Idle Page', event: "" });
                    console.log(IDLE_PAGE);

                    page$("#idle-message").html(WAITING_FOR_MAIN_TASK_PAGE);

                    quizWaitlistReq({ username: username });
                }

                setStageAndPage(null, IDLE_PAGE);
                setupSockets();
                initPage();
            }
        },
        {   // _STATE.QUIZ
            state: _STATE.QUIZ,
            page: _PAGE.MAIN_TASK_PAGE,
            onEnter: function() {
                function initPage() {
                    renderMainTaskPage();

                    // Migrated from .moocchat-next-button onclick event handler
                    page$(".moocchat-next-button")
                        .off("click")
                        .on("click", function() {
                            var j = page$("#moocchat-justification-blank").val();

                            if (!j || typeof (j) != "string") { j = ""; }
                            
                            // Below is commented out to delay sending the submission until AFTER the quiz
                            // group has been formed (see the data below set for the state transition)
                            // socket.emit("probingQuestionAnswerSubmission", { username: username, screenName: screenName, quizRoomID: quizRoomID, questionNumber: questionNumber, answer: probingQuestionChoicesClicked[0], justification: j, timestamp: new Date().toISOString() });
                            // socket.emit('user_flow', { username: username, timestamp: new Date().toISOString(), page: 'Main Task Page', event: 'Submitted First Answer and Justification', data: probingQuestionChoicesClicked[0] });
                            
                            // stage = DISCUSS_PROBING_STAGE;
                            // updatePage(currentPage);
                            
                            // Pass the data along as part of the answer submission delay
                            StateFlow.goTo(_STATE.AWAIT_GROUP_FORMATION, {
                                submission: {
                                    answer: probingQuestionChoicesClicked[0],
                                    justification: j
                                }
                            });
                        });
                }

                setStageAndPage(PROBING_QUESTION_STAGE, MAIN_TASK_PAGE);
                initPage();
            },
            onLeave: function() {
                // Detach onclick handler
                page$(".moocchat-next-button").off("click");
            }
        },
        {   // _STATE.AWAIT_QUIZ_DISCUSSION_ROOM
            state: _STATE.AWAIT_QUIZ_DISCUSSION_ROOM,
            page: _PAGE.IDLE_PAGE,
            onEnter: function(incomingStateData) {
                // Socket callbacks

                /**
                 * Previously receiveProbAnswers().
                 * Callback run when we get the set of answers from everyone in the group
                 */
                function receiveGroupAnswers(data) {   //  data : [{username, screenName, answer}, ...]
                    probAnswers = data;
                    console.log(probAnswers);

                    StateFlow.goTo(_STATE.QUIZ_DISCUSSION);
                }

                function setupSockets() {
                    socket.once("probAnswers", receiveGroupAnswers);
                }

                function initPage() {
                    // Send delayed answer submission now
                    socket.emit("probingQuestionAnswerSubmission", { username: username, screenName: screenName, quizRoomID: quizRoomID, questionNumber: questionNumber, answer: incomingStateData.submission.answer, justification: incomingStateData.submission.justification, timestamp: new Date().toISOString() });
                    socket.emit('user_flow', { username: username, timestamp: new Date().toISOString(), page: 'Main Task Page', event: 'Submitted First Answer and Justification', data: incomingStateData.submission.answer });
                            
                    socket.emit('user_flow', { username: getUserName(), timestamp: new Date().toISOString(), page: 'Idle Page', event: "" });
                    console.log(IDLE_PAGE);

                    page$("#idle-message").html(WAITING_FOR_DISCUSSION);
                }

                setStageAndPage(null, IDLE_PAGE);
                setupSockets();
                initPage();
            }
        },
        {   // _STATE.QUIZ_DISCUSSION
            state: _STATE.QUIZ_DISCUSSION,
            page: _PAGE.MAIN_TASK_PAGE,
            onEnter: function() {
                // Socket callbacks

                /**
                 * Previously showIncomingMessage().
                 */
                function showChatMessage(data) {   //  data {username, quizRoomID, screenName, message}
                    var screenNameSlug = getSlug(data.screenName);
                    var blockstart = "<blockquote class='moocchat-message " + screenNameSlug + "'>";
                    var sn;
                    if (data.screenName == screenName) sn = "Me";
                    else if (data.screenName == "system") sn = "";
                    else sn = data.screenName;

                    if (sn == "")
                        var msg = "<p>" + htmlEscape(data.message) + "</p>";
                    else
                        var msg = "<p>" + sn + " : " + htmlEscape(data.message) + "</p>";

                    var blockend = "</blockquote>";

                    page$(".moocchat-chat").append(blockstart + msg + blockend);
                    page$(".moocchat-chat").scrollTop(scrollPosition);
                    scrollPosition += SCROLL_SPEED;

                    lastChat = new Date();
                }

                /**
                 * Previously requestToQuitUpdated().
                 */
                function receiveChatQuitRequest(data) {   //  data {screenName, wantToQuit, numMembers, quitReq}
                    if (data.numMembers != numMembers) numMembers = data.numMembers;

                    if (typeof data.wantToQuit === 'undefined') {
                        //  FORCE QUIT TO SKIP DISCUSSION STAGE
                    }
                    else if (data.wantToQuit) {
                        showChatMessage({ username: "system", quizRoomID: quizRoomID, screenName: "system", message: data.screenName + " requested to end the discussion. You may end the discussion if all the members make the request. (" + data.quitReq + "/" + data.numMembers + ")." });
                    }
                    else {
                        showChatMessage({ username: "system", quizRoomID: quizRoomID, screenName: "system", message: data.screenName + " canceled the request. You may end the discussion if all the members make the request. (" + data.quitReq + "/" + data.numMembers + ")." });
                    }

                    if (numMembers <= data.quitReq) {

                        //  QUIT DISCUSSION AND PROCEED TO PROBING QUESTION STAGE
                        if (typeof data.wantToQuit !== 'undefined') chatObj = page$(".moocchat-chat-area .moocchat-chat");

                        StateFlow.goTo(_STATE.QUIZ_REVISION);
                    }
                }

                /**
                 * Previously memberDisconnected().
                 */
                function chatMemberDisconnected(disconnectedMemberUsername) {
                    //  IN COMMON
                    numMembers--;
                    //  TODO: SEND A REPORT TO THE SERVER

                    //  SHOW A SYSTEM MESSAGE SAYING SOMEONE DISCONNECTED: TESTED
                    var sn = 'A student in this group';
                    for (var i = 0; i < userList.length; i++) {
                        var user = userList[i];
                        if (username == user['username']) {
                            sn = user['screenName'];
                            break;
                        }
                    }
                    var message = sn + ' has disconnected. You can still finish this task, though.';
                    showChatMessage({ username: 'system', quizRoomID: quizRoomID, screenName: 'system', message: message });
                }


                function setupSockets() {
                    socket.on("chatMessage", showChatMessage);
                    socket.on("requestToQuitUpdated", receiveChatQuitRequest);
                    socket.on("memberDisconnected", chatMemberDisconnected);
                }

                function initPage() {
                    renderMainTaskPage();

                    // Migrated from .moocchat-next-button onclick event handler
                    page$(".moocchat-next-button")
                        .off("click")
                        .on("click", function() {
                            socket.emit("discussionQuitReq", { screenName: screenName, quizRoomID: quizRoomID, wantToQuit: wantToQuit, timestamp: new Date().toISOString() });
                            wantToQuit = !wantToQuit;
                            if (wantToQuit) {
                                socket.emit('user_flow', { username: username, timestamp: new Date().toISOString(), page: 'Main Task Page', event: 'In Chat Room' });
                                page$(".moocchat-next-button").html("Request to End Chat");

                            }
                            else {
                                page$(".moocchat-next-button").html("Cancel the Request");
                                socket.emit('user_flow', { username: username, timestamp: new Date().toISOString(), page: 'Main Task Page', event: 'Clicked Request to End Chat' });
                            }
                        });
                }
                
                setStageAndPage(DISCUSS_PROBING_STAGE, MAIN_TASK_PAGE);
                setupSockets();
                initPage();
            },
            onLeave: function() {
                socket.off("chatMessage");
                socket.off("requestToQuitUpdated");
                socket.off("memberDisconnected");
            }
        },
        {   // _STATE.QUIZ_REVISION
            state: _STATE.QUIZ_REVISION,
            page: _PAGE.MAIN_TASK_PAGE,
            onEnter: function() {
                function initPage() {
                    renderMainTaskPage();

                    // Migrated from .moocchat-next-button onclick event handler
                    page$(".moocchat-next-button")
                        .off("click")
                        .on("click", function() {
                            //  DISABLE CHOICES
                            isChoicesClickable = false;

                            //  SUBMIT
                            var j = page$("#moocchat-justification-blank").val();
                            if (!j || typeof (j) != "string") { j = ""; }

                            socket.emit("probingQuestionFinalAnswerSubmission", { username: username, screenName: screenName, quizRoomID: quizRoomID, questionNumber: questionNumber, answer: probingQuestionChoicesClicked[0], justification: j, timestamp: new Date().toISOString() });
                            socket.emit('user_flow', { username: username, timestamp: new Date().toISOString(), page: 'Main Task Page', event: 'Submitted Final Answer and Justification', data: probingQuestionChoicesClicked[0] });

                            StateFlow.goTo(_STATE.SURVEY);
                        });
                }
                
                setStageAndPage(PROBING_REVISE_STAGE, MAIN_TASK_PAGE);
                initPage();
            }
        },
        {   // _STATE.QUIZ_EXPLANATION
            state: _STATE.QUIZ_EXPLANATION,
            page: _PAGE.MAIN_TASK_PAGE,
            onEnter: function() {
                function initPage() {
                    pauseGroupTimer();  //It pauses the timer, otherwise completed page (last page) will go back to Survey Page and wont be able to proceed. Added 23/07/2015

                    renderMainTaskPage();

                    console.log("1468:" + stage);

                    // Migrated from .moocchat-next-button onclick event handler
                    page$(".moocchat-next-button")
                        .off("click")
                        .on("click", function() {
                            StateFlow.goTo(_STATE.SURVEY);
                        });
                }

                setStageAndPage(PROBING_EXPLANATION_STAGE, MAIN_TASK_PAGE);
                initPage();
            }
        },
        {   // _STATE.SURVEY
            state: _STATE.SURVEY,
            page: _PAGE.POST_SURVEY_PAGE,
            onEnter: function() {
                function initPage() {
                    pauseGroupTimer(); //It pauses the timer, otherwise completed page (last page) will go back to Survey Page and wont be able to proceed. Added 23/07/2015

                    socket.emit('user_flow', { username: getUserName(), timestamp: new Date().toISOString(), page: 'Survey Page', event: '' });
                    console.log(POST_SURVEY_PAGE);
                }

                function setFinishButtonHandler() {

                    // Finish button click handler
                    page$(".moocchat-finish-button").click(function() {

                        page$('#survey_questions').validate({
                            rules: {
                                general: {
                                    required: true
                                }
                            },
                            messages: {
                                general: 'Please provide your feedback'

                            }

                        });



                        var general = page$("#general").val();
                        var discussion = page$('input[name=discussion]:checked').val();
                        var english = page$('input[name=english]:checked').val();
                        var past = page$('input[name=past]:checked').val();
                        var pastComment = page$("#pastComment").val();
                        var level_of_understanding = page$('input[name=level_of_understanding]:checked').val();
                        var in_discussion = page$('input[name=in_discussion]:checked').val();
                        var in_discussion_group = page$('input[name=in_discussion_group]:checked').val();

                        if (general == "") {
                            page$("#general").focus();
                            page$(".general_error").addClass('has-error');
                            //alert("Please answer the required questions.");
                        }

                        else if (typeof discussion === "undefined") {
                            page$('input[name=discussion]').focus();
                            page$(".discussion_error").addClass('has-error');
                        }

                        else if (typeof level_of_understanding === "undefined") {
                            page$('input[name=level_of_understanding]').focus();
                            page$(".level_of_understanding_error").addClass('has-error');
                        }

                        else if (typeof in_discussion === "undefined") {
                            page$('input[name=in_discussion]').focus();
                            page$(".in_discussion_error").addClass('has-error');
                        }

                        else if (typeof in_discussion_group === "undefined") {
                            page$('input[name=in_discussion_group]').focus();
                            page$(".in_discussion_group_error").addClass('has-error');
                        }


                        else {
                            page$("general_error,.discussion_error,.level_of_understanding_error,.in_discussion_error,.in_discussion_group_error").removeClass('has-error');

                            //  SUBMIT
                            socket.emit("submitSurvey", { username: username, general: general, discussion: discussion, level_of_understanding: level_of_understanding, in_discussion: in_discussion, in_discussion_group: in_discussion_group, english: english, past: past, pastComment: pastComment, timestamp: new Date().toISOString() });

                            //  FINISH
                            StateFlow.goTo(_STATE.SURVEY_COMPLETION);
                        }
                    });
                }
                
                setStageAndPage(null, POST_SURVEY_PAGE);
                initPage();
                setFinishButtonHandler();
            }
        },
        {   // _STATE.SURVEY_COMPLETION
            state: _STATE.SURVEY_COMPLETION,
            page: _PAGE.COMPLETED_PAGE,
            onEnter: function() {
                socket.emit('user_flow', { username: getUserName, timestamp: new Date().toISOString(), page: 'Completed', event: '' });
                console.log(COMPLETED_PAGE);

                setStageAndPage(null, COMPLETED_PAGE);
            }
        }
    ]);

    // Start
    
    //  We need to check whether we have a session or not when we start
    //  (if there isn't a session, then don't do anything.)
    //
    //  Currently, checking for the presence of "wait-page" is sufficient
    var isSessionActive = ($("#wait-page").length > 0);
    
    if (isSessionActive) {
        StateFlow.goTo(_STATE.INTRODUCTION);
    }

});
