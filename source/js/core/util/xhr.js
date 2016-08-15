// Cheap, extremely minimal XHR
// Takes subset of $.ajax params -- data, contentType, headers, cache, dataType, url, success, error

define(
  [
    'core/native-functions'
  ],
  function (
    nativeFn
  ) {
  'use strict';

  // -- PRIVATE --

  // Cross-browser XHR requests
  function initRequest(postData, requestObj, optionalContentTypeOverride, successFnOverride) {
    var xhr = new XMLHttpRequest(),
      type = postData ? 'POST' : 'GET',
      contentType = optionalContentTypeOverride || requestObj.contentType;

    xhr.open(type, requestObj.url, true);
    if (contentType) {
      // If post, the content type is what we're sending, if get it's what we're receiving
      xhr.setRequestHeader(postData ? 'Content-Type' : 'Accept', contentType);
    }

    xhr.onload = function() {
      if (xhr.status < 400) {
        var successFn = successFnOverride || requestObj.success;
        if (successFn) {
          successFn(xhr.responseText);
        }
      }
      else {
        var errorFn = requestObj.error;
        if (errorFn) {
          errorFn(xhr.statusText);
        }
      }
    };

    // Send it!
    xhr.send(postData);
  }

  // -- PUBLIC ---

  // Gets the JSON text and returns a JS object
  function getJSON(requestObj) {
    initRequest(null, requestObj, 'application/json', function(jsonText) {
      requestObj.success(nativeFn.JSON.parse(jsonText));
    });
  }

  function get(requestObj) {
    initRequest(null, requestObj, null);
  }

  function post(requestObj) {
    // Sending with text/plain instead of application/json avoids the extra CORS preflight requests
    // This is called a "Simple CORS Request" and has a number of requirements.
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Simple_requests
    initRequest(nativeFn.JSON.stringify(requestObj.data), requestObj, 'text/plain');
  }

  return {
    getJSON: getJSON,
    get: get,
    post: post
  };
});

