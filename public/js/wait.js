var timer;
var username = "";
var COOKIE_USERNAME = "moocchat_username";
var SIGN_OUT_PREFIX = "If you're not <em>";
var SIGN_OUT_POSTFIX = "</em>, please click <span id='sign_out_link'>here</span> to sign out.";
var SIGN_IN_TEXT = "Please click <span id='sign_in_link'>here</span> to sign in.";
var COOKIE_SET = false;

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

      function showUI(ui_class, show) {
        if(show) {
          $('.' + ui_class).css('display', 'block');
        } else {
          $('.' + ui_class).css('display', 'none');
        }
      }

      var minutesBetweenTrials = 2;

      // From http://stackoverflow.com/questions/14346414/how-do-you-do-html-encode-using-javascript
      function htmlEncode(value){
        return $('<div/>').text(value).html();
      }

      function replaceSpan(id, text) {
        // From http://stackoverflow.com/questions/4784568/set-content-of-html-span-with-javascript
        var span = document.getElementById(id);
        while( span.firstChild ) {
            span.removeChild( span.firstChild );
        }
        span.appendChild( document.createTextNode(text) );
      }

      function contains(arr, obj) {
          for (i=0; i < arr.length; i++) {
              if (arr[i] == obj) {
                  return true;
              }
          }
          return false;
      }

      function init() {
        if($.cookie(COOKIE_USERNAME)!=null) {
          COOKIE_SET = true;
          username = $.cookie(COOKIE_USERNAME);
        }
        // assignmentId = gup('assignmentId');
        // if (assignmentId == "ASSIGNMENT_ID_NOT_AVAILABLE") {
        //   showUI('turk_preview_ui', true);
 //          showUI('waiting_ui', false);
        // } else {
          showUI('turk_preview_ui', false);
          showUI('waiting_ui', true);
          // replaceSpan('workerId', htmlEncode(gup('workerId')));
          replaceSpan('minutes', minutesBetweenTrials);
          var socket = connect();
          socket.on('getTimeComplete', getTimeComplete);
          socket.emit('getTime', {username:username});
          // socket.emit('getTime', {username:gup('workerId')});
          if(username=="") {
            $('#sign_in_out').html(SIGN_IN_TEXT);
            $('#sign_in_link').click(function(e) {
              location.replace("./");
            });
          }
          else {
            // Disabled for edX, we want them to be forced to use their edX username
            // $('#sign_in_out').html(SIGN_OUT_PREFIX + username + SIGN_OUT_POSTFIX);
            $('#sign_out_link').click(function(e) {
              $.removeCookie(COOKIE_USERNAME, {path:"/"});
              location.replace("./");
            });
          }
        // }
      }

      function getTimeComplete(timeStr) {
        var timeServer = new Date(timeStr);
        var timeLocal = new Date();
        var timeDiffMs = timeLocal.getTime() - timeServer.getTime();
        timer = setInterval(function() {
          var date = new Date();
          date.setTime(date.getTime() - timeDiffMs);

          var h = date.getUTCHours();
          var m = date.getUTCMinutes();
          var s = date.getUTCSeconds();
          // console.log(h + ":" + m + ":" + s);

          var mRemaining = 0;
          var sRemaining = 60 - s;
          mRemaining = (Math.floor(m/minutesBetweenTrials)+1)*minutesBetweenTrials - m - 1;
          if(sRemaining >= 60) { sRemaining -= 60; mRemaining+=1; }

          // This "freezes" the timer at zero for 10 seconds or so,
          // allowing for missed events
          sRemaining -= 10;
          if(sRemaining < 0) { sRemaining += 60; mRemaining-=1; }
          if(mRemaining < 0) { sRemaining=mRemaining=0; }

          // testWorkerIds = ["A2X3ZSPAADO7P1", "A172XZJCUW07G6"];
          testWorkerIds = [];
          if (contains(testWorkerIds, gup('workerId'))) {
              mRemaining = 0;
              sRemaining = 0;
          }

          $('#time').html("<h1>" + "Session starts in " + (mRemaining<10 ? "0"+mRemaining : mRemaining) + " : " + (sRemaining<10 ? "0"+sRemaining : sRemaining) + "</h1>");
          
          if(mRemaining + sRemaining/60 < minutesBetweenTrials/7) {  //  SESSION START IMMINENT
            $('#header').css('background-color', '#e54028');
            $('#header').css('color', 'white');
          }
          else {  //  NORMAL STATE
            $('#header').css('background-color', 'white');
            $('#header').css('color', 'black');
          }

          if(mRemaining == 0 && sRemaining == 0) {
            // Redirect to main app
            // No need to URI encode, gup does not decode them in the first place
            // location.replace("./client.html?assignmentId=" + gup('assignmentId') + "&workerId=" + gup('workerId')  + "&hitId=" + gup('hitId') + "&turkSubmitTo=" + gup('turkSubmitTo'));
            if(username!="") {
                alert ("The interactive review session is now starting.");
                location.replace("./client.html");
            } else {
              alert("You couldn't join this session you have not signed in. Please sign in.");
              location.replace("./");
            }
          }
        }, 1000);
      }

      $(document).ready(function() {
        $.getScript("js/settings.js", function(){
          init();
        });
      });
