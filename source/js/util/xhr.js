// Cheap, extremely minimal XHR for IE9+ and other browsers
// Takes subset of $.ajax params -- data, contentType, headers, cache, dataType, url, success, error

// TODO do we need these abilities for metrics?
// crossDomain: true,
//  beforeSend: function(xhrObj){
//  xhrObj.setRequestHeader('Content-Type', 'application/json');
//  xhrObj.setRequestHeader('Accept', 'application/json');
//},



define([], function () {

  // Gets the JSON text and returns a JS object
  function getJSON(requestObj) {
    get(requestObj, function(jsonText) {
      requestObj.success(JSON.parse(jsonText));
    });
  }

  // Get JSONP -- cheap imitation that doesn't bother with the callback, just uses a regular request and strips out the callback text
  function getJSONP(requestObj) {

//    function getJsonText(jsonpText) {
//      return jsonpText.substring(jsonpText.indexOf('{'), jsonpText.indexOf('}') + 1);
//    }
//
//    get(requestObj, function(jsonpText) {
//      var jsonText = getJsonText(jsonpText);
//      requestObj.success(JSON.parse(jsonText));
//    });
    
  }

  function get(requestObj, successFnOverride) {
    initRequest(undefined, requestObj, successFnOverride);
  }

  function post(requestObj) {
    initRequest(requestObj.data, requestObj);
  }

  function initRequest(postData, requestObj, successFnOverride) {
    var xhr = new XMLHttpRequest(),
      type = postData ? 'POST' : 'GET';

    xhr.onload = function() {
      if (xhr.status === 200) {
        var successFn = successFnOverride || requestObj.success;
        successFn && successFn(xhr.responseText);
      }
      else {
        var errorFn = requestObj.error;
        errorFn && errorFn(xhr.statusText);
      }
    };

    if ('withCredentials' in xhr) {
      xhr.open(type, requestObj.url, true);
    } else {
      xhr = new XDomainRequest();
      xhr.open(type, requestObj.url);
    }

    postData ? xhr.send(data) : xhr.send();
  }

  return {
    getJSON: getJSON,
    getJSONP: getJSONP,
    get: get,
    post: post
  };
});

