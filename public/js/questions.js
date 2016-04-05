var username = "";
var COOKIE_USERNAME = "moocchat_username";
var SIGN_OUT_PREFIX = "If you're not <em>";
var SIGN_OUT_POSTFIX = "</em>, please click <span id='sign_out_link'>here</span> to sign out.";
var COOKIE_SET = false;

if($.cookie(COOKIE_USERNAME)!=null) {
  COOKIE_SET = true;
  username = $.cookie(COOKIE_USERNAME);
}
if(username=="") {
  location.replace("./");
} else {
    // Disabled for edX, we want them to be forced to use their edX username
    // $('#sign_in_out').html(SIGN_OUT_PREFIX + username + SIGN_OUT_POSTFIX);
    $('#sign_out_link').click(function(e) {
      $.removeCookie(COOKIE_USERNAME, {path:"/"});
      location.replace("./");
    });
}
