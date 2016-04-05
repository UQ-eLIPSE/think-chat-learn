//  START CONSTANTS
var ENTER_KEY_CODE = 13;
var COOKIE_USERNAME = "moocchat_username";
var COOKIE_SET = false;
//  END CONSTANTS

//  START GLOBAL VARIABLES
var readmeShow = false;
var username = "";
//  END GLOBAL VARIABLES

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

function nextPage(username) {
  if(!COOKIE_SET) {
    $.cookie(COOKIE_USERNAME, username, {path: "/"});
    COOKIE_SET = true;
  }
  // Until IRB is ready, skip consent page
  location.replace("./consent.html");
  // location.replace("./wait.html");
}

if (gup("username") != "") {
  nextPage(gup("username"));
}

//  START USER EVENT HANDLERS
$('#login_button').click(function(event) {
  if(!COOKIE_SET && $('#username').val().length==0) return;
  nextPage($('#username').val());
});

$('#showhide').click(function(e) {
  if(readmeShow) {
    readmeShow = false;
    $(this).html("Show Read Me &gt;&gt;");
    showUI('collapsible', false);
  }
  else {
    readmeShow = true;
    $(this).html("Hide Read Me &gt;&gt;");
    showUI('collapsible', true);
  }
});

$('#username').keydown(function(e) {
  if(e.which != ENTER_KEY_CODE) return;
  $('#login_button').click();
});
//  END USER EVENT HANDLERS

function init() {
  //  START
  // if($.cookie(COOKIE_USERNAME) {
  //   username = $.cookie(COOKIE_USERNAME);
  //   $('#login_button').click();
  // }

  if($.cookie(COOKIE_USERNAME)!=null) {
    COOKIE_SET = true;
    username = $.cookie(COOKIE_USERNAME);
    $('#login_button').click();
  }

  showUI('login_ui', true);
  showUI('collapsible', false);
}

function showUI(ui_class, show) {
  if(show) {
    $('.' + ui_class).css('display', 'block');
  }
  else {
    $('.' + ui_class).css('display', 'none');
  }
}

if(parent) {
  if(window.addEventListener) {
    window.addEventListener('load', init, false);
  }
  else if(window.attachEvent) {
    window.attachEvent('onload', init);
  }
}
else {
  $(document).ready(function() {
    init();
  });
}
