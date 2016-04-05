var timer;
var username = "";
var COOKIE_USERNAME = "moocchat_username";
var SIGN_OUT_PREFIX = "If you're not <em>";
var SIGN_OUT_POSTFIX = "</em>, please click <span id='sign_out_link'>here</span> to sign out.";
var SIGN_IN_TEXT = "Please click <span id='sign_in_link'>here</span> to sign in.";
var COOKIE_SET = false;

var CONSENT_NO_SELECTION = 0;
var CONSENT_ACCEPTED = 1;
var CONSENT_REJECTED = 2;

      function showUI(ui_class, show) {
        if(show) {
          $('.' + ui_class).css('display', 'block');
        } else {
          $('.' + ui_class).css('display', 'none');
        }
      }

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
        showUI('turk_preview_ui', false);
        showUI('waiting_ui', true);
        var socket = connect();
        socket.on('getConsentComplete', getConsentComplete);
        socket.on('setConsentComplete', setConsentComplete);
        socket.emit('getConsent', {username:username});
        if(username=="") {
          location.replace("./");
        } else {
          // $('#sign_in_out').html(SIGN_OUT_PREFIX + username + SIGN_OUT_POSTFIX);
          // $('#sign_out_link').click(function(e) {
          //  $.removeCookie(COOKIE_USERNAME, {path:"/"});
          //   location.replace("./");
          // });
          $('#consent_accept').click(function(e) {
            window.accept_value = CONSENT_ACCEPTED;
            socket.emit('setConsent', {username:username, value:window.accept_value});
          });
          $('#consent_reject').click(function(e) {
            window.accept_value = CONSENT_REJECTED;
            socket.emit('setConsent', {username:username, value:window.accept_value});
          });
        }
      }

      function getConsentComplete(value) {
        if (value == CONSENT_ACCEPTED) {
          location.replace('wait.html')
        } else if (value == CONSENT_REJECTED) {
          location.replace('questions.html')
        } else {
          showUI('checking_consent_panel', false);
          showUI('consent_panel', true);
        }
      }

      function setConsentComplete(value) {
        if (window.accept_value == CONSENT_ACCEPTED) {
          location.replace('wait.html')
        } else if (window.accept_value == CONSENT_REJECTED) {
          location.replace('questions.html')
        }
      }

      $(document).ready(function() {
        $.getScript("js/settings.js", function(){
          init();
        });
      });
