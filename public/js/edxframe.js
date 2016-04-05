chatframeContent =
['<p><span id="loadingchat">Loading practice question module...</span>',
 '<iframe id="chatiframe"',
 '       style="position: absolute; top: -9999em; visibility: hidden;"',
 '       onload="showDelayed(5,this,\'loadingchat\');"',
 '       src="https://moocchat.berkeley.edu/MoocChat/mcq_client/"',
 '       height="600" width="100%"></iframe></p>',
].join('\n');

$("#chatframe").hide();
$("#chatframe").html(chatframeContent);

function getContentInContainer(matchClass) {
    var elems = document.getElementsByTagName('*'), i;
    for (i in elems) {
        if((' ' + elems[i].className + ' ').indexOf(' ' + matchClass + ' ')
                > -1) {
            return elems[i].textContent;
        }
    }
}

function getUsername() {
  var n = getContentInContainer("user-link").replace("Dashboard for:", "").replace(/^\s+|\s+$/g, '');
  if (!isNaN(n[0])) {
     n = "_" + n;
  }
  return n;
}

function updateChatUrl() {
  username = getUsername();
  document.getElementById('chatiframe').src +=
      '?username=' + encodeURI(username);
}

if (document.getElementById('chatiframe')) {
  init();
} else {
  window.onload = init;
}

function init() {
  updateChatUrl();
  $("#chatframe").show();
}

function showDelayed(delaySeconds, element, elementHide) {
  setTimeout(function(){
    element.style.position='static';
    element.style.visibility='visible';
    document.getElementById(elementHide).style.display='none';
    element.style.visibility='visible';
    document.getElementById(elementHide).style.display='none';
  }, 1000*delaySeconds);
}
