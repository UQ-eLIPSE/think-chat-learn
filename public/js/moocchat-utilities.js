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

// From http://stackoverflow.com/questions/14346414/how-do-you-do-html-encode-using-javascript
function htmlEncode(value) {
  return $('<div/>').text(value).html();
}

// From http://stackoverflow.com/questions/4784568/set-content-of-html-span-with-javascript
function replaceSpan(spanID, text) {
  // var span = document.getElementById(id);
  // while(span.firstChild) {
  //    span.removeChild(span.firstChild);
  // }

  // span.appendChild(document.createTextNode(text));
  $("#" + spanID).html(text);
}

function contains(arr, obj) {
  for(i=0;i<arr.length;i++) {
        if(arr[i] == obj) {
          return true;
        }
  }
  return false;
}

// Decodes query parameters that were URL-encoded
function decode(strToDecode) {
  var encoded = strToDecode;
  return unescape(encoded.replace(/\+/g,  " "));
}

function getMinute(sec) { return Math.floor(sec/60)<10 ? "0"+Math.floor(sec/60) : Math.floor(sec/60); }

function getSecond(sec) { return sec%60<10 ? "0"+sec%60 : sec%60; }

function objectLength(obj) {  //  we cannot use objectName.length to count how many items are in an object
  var cnt = 0;
  for(key in obj) cnt++;
  return cnt;
}


function getTimerEnd(timeOut) {
  var now = new Date();
  return new Date(now.getTime() + timeOut * 1000);
}

function secondsRemaining(timerEnd) {
  var now = new Date();
  if (timerEnd.getTime() >= now.getTime()) {
    return Math.floor((timerEnd.getTime() - now.getTime())/1000);
  } else {
    return Math.floor(0);
  }
}

function getCombinations(arr1, arr2) {  //  now works only for two arrays
  var result = [];
  for(var i=0;i<arr1.length;i++) {
    // var temp = [];
    // temp.push(arr1[i]);
    for(var j=0;j<arr2.length;j++) {
      var temp = [arr1[i], arr2[j]];
      result.push(temp);
    }
  }
  return result;
}

function getSlug(string) {
  var str = string;
  str = str.toLowerCase();
  str = str.replace(/[^a-z0-9]+/g, '-');
  str = str.replace(/^-|-$/g, '');
  return str;
}

// console.log("utilities loaded.");
