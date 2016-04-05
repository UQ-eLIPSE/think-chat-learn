//  We cannot use objectName.length to count how many items are in an object
function objectLength(obj) {
  var cnt = 0;
  for(key in obj) cnt++;
  return cnt;
}

//  Gets an integer >= min and < max
function randomInteger(min, max) {
  return Math.floor((Math.random()*(max-min))+min);
}

//  CHECKS IF AN ARRAY CONTAINS AN OBJECT
function contains(arr, obj) {
  for (i=0; i < arr.length; i++) {
    if (arr[i] == obj) {
      return true;
    }
  }
  return false;
}

module.exports = {
  objectLength: objectLength,
  randomInteger: randomInteger,
  contains: contains
};
