<?php
include('session_config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- From http://stackoverflow.com/questions/1341089/using-meta-tags-to-turn-off-caching-in-all-browsers -->
    <meta http-equiv="cache-control" content="max-age=0" />
    <meta http-equiv="cache-control" content="no-cache" />
    <meta http-equiv="expires" content="0" />
    <meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
    <meta http-equiv="pragma" content="no-cache" />
    <!-- Fixes issue where buttons appear as rectangles and formatting is wrong and unusable occasionally in IE -->
    <!-- Suggested by http://stackoverflow.com/questions/13440230/why-does-the-ie-display-the-bootstrap-theme-wrong-what-could-i-change-in-the-st/ -->
    <meta http-equiv="X-UA-Compatible" content="IE=9" />

    <title>MOOCchat</title>

    <!-- Bootstrap Core CSS -->
    <link href="css/bootstrap-simplex.css" rel="stylesheet" />
	<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">

    <!-- MOOCchat Custom CSS -->
    <link href="css/moocchat.css" rel="stylesheet" />
    <!--[if lt IE 9]>
    <script src="./js/html5shiv.min.js"></script>
    <script src="./js/respond.min.js"></script>
    <![endif]-->
</head>

<body>
	<div id="header" class="text-left">

			<div class="row">
				<div class="col-md-7 col-md-offset-1">
					<h1>ENGG1200 - MoocChat <i class="fa fa-users"></i></h1>
				</div>
				<div class="col-md-4 text-align-right" style="top:14px">
					<img src="img/uq-logo.png" width="150">
				</div>

			</div>
	</div>
	<?php
	if ($session_started == "yes" || isset($_GET['tester'])) {
		$session_started = 'yes';
	?>



  <!-- TODO Add stuff within here -->



	
<!-- START announcement-page -->
<div id="announcement-page" class="moocchat-page">
    <div class="container">
        <div class="row">
            <div class="col-md-4 col-md-offset-4">&nbsp;
            </div>
        </div>
        <div class="row">
            <div class="col-md-4 col-md-offset-4 text-center">
            </div>
        </div>
    </div>
</div>
<!-- END announcement-page -->
<div id="completed-page" class="moocchat-page">
  <div align="center">
    <div class="container">
      <div class="row">
          <div id="completed-message" class="col-md-10 col-md-offset-1 h2">
              You have now completed the task. Your responses have been recorded and will be graded.
          </div>
      </div>
    </div>
  </div>
</div>

<!-- START already-done-page -->
<div id="already-done-page" class="moocchat-page">
    <div class="container">
        <div class="row">
            <div class="col-md-4 col-md-offset-4 text-center">
                <label>You have already completed this task. Each user can only complete this task once.</label>
            </div>
        </div>
    </div>
</div>
<!-- END already-done-page -->
<!-- START consent-page -->
<div id="consent-page" class="moocchat-page">
    <div class="container">
        <div class="row">
            <div id="consent-checking-panel" class="col-md-10 col-md-offset-1">
                <h2>Checking consent information...</h2>
                <div class="progress progress-striped active">
                    <div class="progress-bar progress-bar-info" style="width: 100%"></div>
                </div>
            </div>
            <div id="consent-panel" class="col-md-10 col-md-offset-1 hidden">
                <p>Before participating in the study, please review the Participation Information Sheet (see link below) and then select one of the options at the bottom of the Consent Form below.</p>
      <p>&nbsp;</p>
      <h2>Consent Form</h2>
      <p>&nbsp;</p>
      <h4>Title of the Project: Enhancing academic and practitioner skills in first year Engineers using an active learning course architecture: Online chats and peer learning.</h4>
      <p><strong>Researcher Contact Details: Associate Professor Carl Reidsema</strong><br /> Phone: 3365 3596</p>
      <p>Email: <a href="mailto:c.reidsema@uq.edu.au">c.reidsema@uq.edu.au</a></p>

      <ul>
      <li>I understand that this research project will entail data collection of statements made by me during an online chat session as well as my responses to a brief survey regarding my experiences during the chat.</li>
      <li>I have read the Participant Information Sheet, and I am aware that I can obtain a copy from the Blackboard course site for my future reference.</li>
      <li>I understand that any information taken will be treated with the utmost confidentiality.</li>
      <li>I understand that participation in the research is voluntary, and I can withdraw at any time without prejudice.</li>
      <li>I understand that I may choose not to answer particular questions, without being obliged to withdraw completely from the research.</li>
      <li>I voluntarily consent to participate in this research project.</li>
      </ul>

      <p><a  data-toggle="modal" data-target="#participant_information_sheet_modal">Show me the participant information sheet.</a></p>
      <p>&nbsp;</p>
      <div class="row">
        <div class="col-md-3 col-sm-6  col-xs-6 col-offset-1">
          <button type="button" id="consent-accept" class="btn btn-lg btn-info">I consent to participate in this study. <br> Take me to the chat session now.</button>
        </div>
        <div class="col-md-3  col-sm-6  col-xs-6">
          <button type="button" id="consent-reject" class="btn btn-lg btn-danger">I do not wish to participate in this study.<br> Take me to the chat session now.</button><br/>
        </div>
      </div>

      <!--<p>If you do not wish to visit any of these pages, you may simply close this window.</p>-->
            </div>
        </div>
        <!-- <a href="#portfolio" class="btn btn-lg btn-default page">Click Me!</a>
        <a href="#services" class="btn btn-lg btn-default page">Click Me!</a> -->
    </div>
</div>
<!-- END consent-page -->
<!-- START idle-page -->
<div id="idle-page" class="moocchat-page">
    <div class="container">
        <div class="row">
            <div id="idle-message" class="col-md-10 col-md-offset-1 h2">
                Waiting...
            </div>
        </div>
        <div class="row">
            <div class="col-md-10 col-md-offset-1">
                <div class="progress progress-striped active">
                    <div id="idle-timer" class="progress-bar progress-bar-info" style="width: 100%; text-align:center"></div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- END idle-page -->
<!-- START learning-page -->
<div id="learning-page" class="moocchat-page">
    <div class="container">
        <div class="col-md-6 moocchat-left-panel">
            <div class="row">
                <p class="col-sm-11 h3">In this task, you'll learn a critical reasoning skill commonly called <em>identifying hidden assumptions</em>. Read the following carefully.
                </p>
                <p class="col-sm-11 moocchat-plain-text">
                    You see arguments every day in statements by politicians, businesses, and advertisements.  These arguments are a way of trying to convince you that something is true. Here is an example:<br />
                </p>
                <p class="col-sm-11 lead">
                    Many mobile phone companies protect their technology with patents, and mobile phones continue to become more technically advanced every year.   Therefore, patents lead to strong competition in the marketplace.
                </p>
                <p class="col-sm-11 moocchat-plain-text">
                    This statement contains the key components of an argument: at least one <span class="text-warning">premise</span> and a <span class="text-success">conclusion</span>. But often there are gaps in logic  between the <span class="text-warning">premises</span> and the <span class="text-success">conclusion</span>. These gaps can include <span class="text-info">assumptions</span>, and identifying the unstated <span class="text-info">assumptions</span> helps you spot the logical flaw in the reasoning:
                </p>
                <p class="col-sm-11 moocchat-reading well">
                    Premise(s) + Assumption(s) = Conclusion(s)
                </p>
                <p class="col-sm-11 moocchat-plain-text">
                    If the <span class="text-info">assumptions</span> are incorrect, then the conclusion might not follow.  There are several unstated or hidden <span class="text-info">assumptions</span> in the example above which may be not actually be true:
                </p>
                <ul class="col-sm-10 col-sm-offset-1 moocchat-plain-text">
                    <li class="moocchat-plain-text">
                        <span class="text-info">Assumption</span>: we have plenty of innovation in the presence of patents.
                        <ul class="moocchat-plain-text">
                            <li class="moocchat-plain-text">
                                Perhaps defending against patents takes away resources from making even more innovative inventions.
                            </li>
                        </ul>
                    </li>
                    <li class="moocchat-plain-text">
                        <span class="text-info">Assumption</span>: strong competition is the biggest reason for the advanced technology in the mobile phone business.
                        <ul class="moocchat-plain-text">
                            <li class="moocchat-plain-text">
                                 However, patents award a monopoly (exclusive rights) to the patent holder, thus reducing competition.
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
        <div class="col-md-6 moocchat-right-panel">
            <div class="row">
                <div class="col-sm-11 col-sm-offset-1 moocchat-control-panel">
                    <button type="button" class="col-sm-5 btn btn-lg btn-default main-task-timer disabled" style="visibility:hidden;">Timer&emsp;&emsp;</button>
                    <button type="button" id="learning-button" class="col-sm-6 col-sm-offset-1 btn btn-lg btn-info disabled">Next</button>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-11 col-sm-offset-1 alert alert-info moocchat-learning-right-panel-direction h4">After reading carefully, fill in the blank below and click <em>Next</em> to proceed. You may refer to the learning material on the left.
                </div>
            </div>
            <p class="col-sm-11 col-sm-offset-1 h4">
                Read the short essay below.
            </p>
            <p class="col-sm-11 col-sm-offset-1 moocchat-learning-reading well">
                <!-- With the decline of predators, such as wolves and coyotes, that used to keep the deer population within certain limits, deer have increased in numbers until they cannot feed themselves in the forest alone but must forage on open rangeland in competition with cattle. Thus, in areas where forest borders on rangeland, deer hunting is an essential activity. -->
                <!-- Tests demonstrating that the olfactory bulbs (relating to the sense of smell) of salmon will react upon exposure only to water from their spawning ground and no other water suggest the possibility that repeated exposure to a specific odorant of their spawning area during the first few weeks of life could stimulate olfactory receptor sites, increasing olfactory sensitivity to that single scent and influencing salmon migration to their spawning area. -->
                <!-- Epidemiologist: Malaria passes into the human population when a mosquito carrying the virus bites a human who has no immunity. The malaria parasite can remain for up to forty days in the blood of an infected person. The disease cannot be passed from person to person, unless a non-infected person is exposed to the blood of an infected person. Theoretically, malaria could be eradicated in any given area, if all the mosquitoes carrying malaria in that area are exterminated. If such a course of action is carried out at a worldwide level, then the global eradication of malaria is possible. -->
            </p>
            <p class="col-sm-11 col-sm-offset-1 h4">
                Identify an important unstated assumption in the essay.<br />This response will be shared with other students on the next screen if you have a chance for discussion on the essay.
            </p>
            <p class="col-sm-11 col-sm-offset-1 h5">
                <textarea class="form-control" rows="3" id="promptResp"></textarea>
            </p>
        </div>
    </div>
</div>
<!-- END learning-page -->
<!-- START login-page -->
<div id="login-page" class="moocchat-page">
    <div class="container">
        <div class="row">
            <div class="col-md-4 col-md-offset-4">&nbsp;
            </div>
        </div>
        <div class="row">
            <div class="col-md-4 col-md-offset-4 text-center">
                <label>Please input the alphanumeric student identifier supplied by your instructor.</label>&emsp;<input class="form-control" id="username" name="username" width="30em" type="text" tabIndex="-1" autocomplete="off" value="<?=$_SERVER['HTTP_X_UQ_USER'];?>"/>
            </div>
        </div>
        <div class="row">
            <div class="col-md-4 col-md-offset-4">&nbsp;
            </div>
        </div>
        <div class="row">
            <div class="col-md-4 col-md-offset-4">
                <div id="login-button" class="btn btn-block btn-info">Log In</div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-4 col-md-offset-4 text-center">
                <label id="turk-info-2"></label>
            </div>
        </div>
    </div>
</div>
<!-- END login-page -->
<!-- START invalid-login -->
  <div id="login-invalid" class="moocchat-page">
      <div class="container">
          <div class="row">
              <div class="col-md-6 col-md-offset-2">&nbsp;
              </div>
          </div>

          <div class="row">
              <div class="col-md-8 col-md-offset-4">
        <h2><span class="label label-danger">Sorry, but you cannot login to MOOCchat. </span></h2>
      </div>

      <div class="col-md-6 col-md-offset-3">
      <br/><br/>
      <p><strong>One of two possible reasons:</strong></p>
      <ol>
        <li>You are not enrolled yet to ENGG1200. You need to be enrolled to the course first. </li>
        <li>If you have already enrolled in the course, either you are <i>already logged in </i> another browser or tab, or the database for this quiz has not been updated yet. <strong>Please contact your course co-ordinator regarding this issue.</strong></li>
      </ol>
              </div>
          </div>

      </div>
  </div>
  <!-- END login-page -->
<!-- START main-task-page -->
<div id="main-task-page" class="moocchat-page">
    <div class="container">
        <!-- <div class="row"> -->
            <div class="col-md-6 moocchat-left-panel">
                <div class="row">
                    <div class="col-sm-11 moocchat-left-panel-direction h3">
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-11 moocchat-reading well">
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-11 moocchat-prompt-share-area moocchat-discussion-low moocchat-discussion-high moocchat-main-task-stage-1 moocchat-main-task-stage-6 moocchat-conditional">
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-11 moocchat-post-reading-direction h3">
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-11 moocchat-choice-area moocchat-discussion-low moocchat-discussion-high moocchat-main-task-stage-2 moocchat-main-task-stage-6 moocchat-main-task-stage-7 moocchat-main-task-stage-3 moocchat-main-task-stage-4 moocchat-main-task-stage-5 moocchat-conditional">
                    </div>
                </div>
            </div>
            <div class="col-md-6 moocchat-right-panel">
                <div class="row">
                    <div class="col-sm-11 col-sm-offset-1 moocchat-control-panel">
                        <button type="button" class="col-sm-5 btn btn-lg btn-default main-task-timer disabled">Timer&emsp;<span id="main-task-timer-time"></span></button>
                        <button type="button" class="col-sm-6 col-sm-offset-1 btn btn-lg btn-info moocchat-next-button disabled">Next</button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-11 col-sm-offset-1 alert alert-info moocchat-right-panel-direction h4">
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-11 col-sm-offset-1 moocchat-chat-area moocchat-discussion-low moocchat-discussion-high moocchat-main-task-stage-1 moocchat-main-task-stage-6 moocchat-conditional">
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-11 col-sm-offset-1 moocchat-justification-area moocchat-discussion-low moocchat-discussion-high moocchat-main-task-stage-2 moocchat-main-task-stage-7 moocchat-main-task-stage-4 moocchat-conditional">
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-11 col-sm-offset-1 moocchat-explanation-area moocchat-discussion-low moocchat-discussion-high moocchat-main-task-stage-3 moocchat-main-task-stage-5 moocchat-conditional">
                    </div>
                </div>
            </div>
        <!-- </div> -->
    </div>
</div>
<!-- END main-task-page -->

    <!-- START preview-page -->
    <div id="preview-page" class="moocchat-page">
        <div class="container">
            <div class="row">
                <div class="col-md-4 col-md-offset-4">&nbsp;
                </div>
            </div>
            <div class="row">
                <div class="col-md-4 col-md-offset-4 text-center">
                    <label>In this task you will review a reading passage and then discuss it in a chatroom. A preview appears below. You can only complete this task once.</label>
                </div>
            </div>
            <div class="row">
                <div class="col-md-4 col-md-offset-4">&nbsp;
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 col-md-offset-2">
                    <img width="1005" height="612" src="./img/screenshot.png" />
                </div>
            </div>
            <div class="row">
                <div class="col-md-4 col-md-offset-4 text-center">
                    <label id="turk-info-1"></label>
                </div>
            </div>
        </div>
    </div>
    <!-- END preview-page -->
<div id="submit-hit-page" class="moocchat-page">
  <div align="center">
    <div class="container">
      <div class="row">
          <div id="submit-hit-message" class="col-md-10 col-md-offset-1 h2">
              You have now completed the task. Please click below to submit your HIT for payment.
          </div>
      </div>
      <div class="row">
        <div id="submit-hit-button" class="col-md-10 col-md-offset-1 h2">
          <form id="mturk_form" method="POST" action="https://www.mturk.com/mturk/externalSubmit">
            <input type="hidden" id="assignmentId" name="assignmentId" value="">
            <input type="hidden" id="workerId" name="workerId" value="">
            <input type="hidden" id="hitId" name="hitId" value="">
            <input id="submitButton" type="submit" name="Submit" value="Submit HIT">
          </form>
        </div>
      </div>
      <div class="row">
          <div class="col-md-4 col-md-offset-4 text-center">
              <label id="turk-info-4"></label>
          </div>
      </div>
    </div>
  </div>
</div>
<div id="post-survey-page" class="moocchat-page">
    <div class="container">
  <div class="row">
    <div class="col-md-10 col-md-offset-1">
    <h3>Please answer all the questions below.</h3>
    </div>
  </div>
        <div class="row">
            <form id="survey_questions" name="survey_question">
            <div class="col-md-10 col-md-offset-1 h4 general_error">
                Do you have any comments on this task and tool?
            </div>
            <div class="col-md-6 col-md-offset-3">
                <input class="form-control survey-text-form moocchat-required-survey-response" id="general" name="general" width="30em" type="text" tabIndex="-1" autocomplete="off" />

            </div>

            <div class="col-md-10 col-md-offset-1 h4 discussion_error">
                This activity was:
            </div>
            <div class="col-md-5 col-md-offset-3">
                <table class="table discussion_table ">
                    <thead>
                        <tr>
                            <th class="col-md-1">Not Enjoyable</th>
                            <th class="col-md-1">...</th>
                            <th class="col-md-1">Neutral</th>
                            <th class="col-md-1">...</th>
                            <th class="col-md-1">Enjoyable</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="col-md-1">
                                <input type="radio" name="discussion" id="discussionRadio1" value="1">
                            </td>
                            <td class="col-md-1">
                                <input type="radio" name="discussion" id="discussionRadio2" value="2">
                            </td>
                            <td class="col-md-1">
                                <input type="radio" name="discussion" id="discussionRadio3" value="3">
                            </td>
                            <td class="col-md-1">
                                <input type="radio" name="discussion" id="discussionRadio4" value="4">
                            </td>
                            <td class="col-md-1">
                                <input type="radio" name="discussion" id="discussionRadio5" value="5">
                            </td>
                        </tr>
                    </tbody>
                </table>

            </div>
    <div class="col-md-10 col-md-offset-1 h4">
              Understanding:
            </div>
            <div class="col-md-5 col-md-offset-3">
      <h4 class="level_of_understanding_error">My level of understanding for this question was:</h4>
                <table class="table level_of_understanding_table">

                    <tbody>
                        <tr>
                            <td class="col-md-1">
                                <input type="radio" name="level_of_understanding" id="understandingRadio1" value="I did not know the answer">
              <label for="understandingRadio1">I did not know the answer</label>
                            </td>
          </tr>
          <tr>
                            <td class="col-md-1">
                                <input type="radio" name="level_of_understanding" id="understandingRadio2" value="I knew what the answer was but not why ">
              <label for="understandingRadio2">I knew what the answer was but not why </label>
                            </td>
          </tr>


    <tr>
                            <td class="col-md-1">
                                <input type="radio" name="level_of_understanding" id="understandingRadio3" value="I knew what the answer was but only partly understood">
              <label for="understandingRadio3">I knew what the answer was but only partly understood</label>
            </td>
          </tr>
          <tr>
                            <td class="col-md-1">
                                <input type="radio" name="level_of_understanding" id="understandingRadio4" value="I knew what the answer was but only partly understood">
              <label for="understandingRadio4">I knew what the answer was and fully understood </label>
            </td>
          </tr>





                    </tbody>
                </table>

            </div>
    <div class="col-md-10 col-md-offset-1 h4">
              Quality of interaction:
            </div>
            <div class="col-md-5 col-md-offset-3">
      <h4 class="in_discussion_error">In the discussion...</h4>
                <table class="table in_discssion_table">

                    <tbody>
                        <tr>
                            <td class="col-md-1">
                                <input type="radio" name="in_discussion" id="in_discussion1" value="I gave my own ideas but did not really consider others ideas">
              <label for="in_discussion1">I gave my own ideas but did not really consider others ideas</label>
                            </td>
          </tr>
          <tr>
                            <td class="col-md-1">
                                <input type="radio" name="in_discussion" id="in_discussion2" value="I considered others ideas but did not really state my own">
              <label for="in_discussion2">I considered others ideas but did not really state my own</label>
                            </td>
          </tr>
          <tr>
                            <td class="col-md-1">
                                <input type="radio" name="in_discussion" id="in_discussion3" value="I gave my own ideas and I considered others ideas">
              <label for="in_discussion3">I gave my own ideas and I considered others ideas</label>
                            </td>
          </tr>

                    </tbody>
                </table>
      <label class="error hidden in_discussion_error">Please select an option</label>
            </div>

            <div class="col-md-7 col-md-offset-3">
      <h4 class="in_discussion_group_error">In the discussion, our group ...</h4>
                <table class="table in_discssion_group_table">

                    <tbody>
                        <tr>
                            <td class="col-md-1">
                                <input type="radio" name="in_discussion_group" id="in_discussion_group1" value="All stated their own ideas but with no real interaction">
              <label for="in_discussion_group1">All stated their own ideas but with no real interaction</label>
                            </td>
          </tr>
          <tr>
                            <td class="col-md-1">
                                <input type="radio" name="in_discussion_group" id="in_discussion_group2" value="Discussed ideas  to get the correct answer but not to fully understand">
              <label for="in_discussion_group2">Discussed ideas  to get the correct answer but not to fully understand</label>
                            </td>
          </tr>
          <tr>
                            <td class="col-md-1">
                                <input type="radio" name="in_discussion_group" id="in_discussion_group3" value="Discussed ideas  to get the correct answer and to fully understand">
              <label for="in_discussion_group3">Discussed ideas  to get the correct answer and to fully understand</label>
                            </td>
          </tr>
          <tr>
                            <td class="col-md-1">
                                <input type="radio" name="in_discussion_group" id="in_discussion_group4" value="Mostly just agreed with the person/s who seem to know the answer">
              <label for="in_discussion_group4">Mostly just agreed with the person/s who seem to know the answer</label>
            </td>
          </tr>

                    </tbody>
                </table>
      <label class="error hidden in_discussion_group_error">Please select an option</label>
            </div>
            <button type="button" class="col-md-6 col-sm-offset-3 btn btn-lg btn-success moocchat-finish-button">Finish</button><br/>
    </form>
        </div>
    </div>
</div>
<!-- START wait-page -->
<div id="wait-page" class="moocchat-page">
    <div class="col-md-4 col-md-offset-4 text-center">
       <label>It is recommended to complete this task on a PC/Mac using Firefox or Google Chrome.</label>
    </div>
    <div class="container">
        <!-- <div id="wait-timer-bar" class="navbar navbar-default"> -->
            <!-- <div class="navbar-header"> -->
                <!-- <label class="navbar-brand">Session starts in <span id="wait-page-timer">&nbsp;</span></label> -->
            <!-- </div> -->


        <!-- </div> -->
        <div class="row">
            <div id="instruction-panel" class="col-md-10 col-md-offset-1">

                    <h2>Task Instructions</h2><br />
                    <ol>
          <li>Log in using your student ID.</li>
          <li>Respond to a multiple-choice question covering the course material and provide a justification for your answer (within 6 minutes).</li>
          <li>Discuss the question answers from you and other students. You may have to wait up to 4 minutes for a group to be formed. The system will create your group as soon as 3 users are available.<br>
                Try to learn from or help others so as to ensure that you all have a good understanding of the underlying concepts, rather than just focusing on what the right answer might be. This will ensure that you maximise the benefits to yourself and to your group from participating in the chat.</li>
          <li>The answer selected and the justification will be displayed next to the chat window. In case there are no students available to do the task together with, reflect upon your own answer (up to 15 minutes).</li>
          <li>Revise your response to the question based on the discussion (within 1.5 minutes).</li>
          <li>Fill out a brief questionnaire about the chat room experience.</li>
        </ol>

                <p>
                      <button type="button" id="moocchat-start-button" class="col-md-4 col-sm-offset-4 btn btn-lg btn-info" style="margin-top:15px;">Start</button>
                </p>
            </div>
        </div>
    </div>
</div>
<!-- END wait-page -->
<div id="footer" class="footer">


</div>





<?php
} else { # If server not currently active, show following page instead
?>


  <!-- START preview-page -->
  <div id="preview-page" class="moocchat-page">
      <div class="container">
          <div class="row">
              <div class="col-md-6 col-md-offset-2">&nbsp;
              </div>
          </div>
          <div class="row">
              <div class="col-md-6 col-md-offset-3 text-center">
                  <label><?=$next_session_text;?></label>
              </div>
          </div>
      </div>
  </div>
  <!-- END preview-page -->

<?php
}
?>
<div id="session_question" class="hidden">
Next session is on Thursday, 06/08/2015 from 20:00 to 22:00.
<!--<?= $question; ?>--></div>




<div id="dialog" style="display:none">
  <div>

  </div>
</div>
</body>
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-65584333-1', 'auto');
  ga('send', 'pageview');
  //ga('set', '&uid', {{'<?php echo $_SERVER["HTTP_X_UQ_USER"]; ?>'}}); // Set the user ID using signed-in user_id.
</script>
    <!-- Core JavaScript -->
  <script src="./js/socket.io-1.4.5.js"></script>
  <script src="./js/jquery-2.2.3.min.js"></script>
  <script src="./js/bootstrap.min.js"></script>
  <script src="./js/jquery.cookie.js"></script>
 <script src="./js/jquery.validate.min.js"></script>
  <!-- MOOCchat Custom JavaScript -->
  <script src="./js/settings.js"></script>
  <script src="./js/moocchat-utilities.js"></script>
  <script src="./js/moocchat.constants.js"></script>
  <script src="./js/moocchat.stages.js"></script>
  <script src="./js/moocchat.js"></script>
  <script src="./js/stateflow.js"></script>
  <script src="./js/moocchat-state-based.js"></script>
</html>
<!-- Modal -->
<div class="modal fade" id="participant_information_sheet_modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
<div class="modal-dialog modal-lg" role="document">
  <div class="modal-content">
    <div class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
      <h4 class="modal-title" id="myModalLabel">Participant Information Sheet</h4>
    </div>
    <div class="modal-body">
            <object type="application/pdf" data="ENGG1200_MOOCchat_Participant_Information_Sheet.pdf" width="100%" height="500">this is not working as expected</object>

    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>

    </div>
  </div>
</div>
</div>
