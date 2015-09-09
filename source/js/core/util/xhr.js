// Cheap, extremely minimal XHR for IE9+ and other browsers
// Takes subset of $.ajax params -- data, contentType, headers, cache, dataType, url, success, error



define([], function () {

  // Gets the JSON text and returns a JS object
  function getJSON(requestObj) {
    initRequest(null, requestObj, 'application/json', function(jsonText) {
      requestObj.success(JSON.parse(jsonText));
    });
  }

  function get(requestObj) {
    initRequest(null, requestObj, null);
  }

  function post(requestObj) {
    initRequest(JSON.stringify(requestObj.data), requestObj, 'application/json');
  }

  function initRequest(postData, requestObj, optionalContentTypeOverride, successFnOverride) {
    var xhr = new XMLHttpRequest(),
      type = postData ? 'POST' : 'GET',
      contentType = optionalContentTypeOverride || requestObj.contentType;

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

    if (contentType) {
      // If post, the content type is what we're sending, if get it's what we're receiving
      xhr.setRequestHeader(postData ? 'Content-Type' : 'Accept', contentType);
    }

    postData ? xhr.send(postData) : xhr.send();
  }

  return {
    getJSON: getJSON,
    get: get,
    post: post
  };
});

