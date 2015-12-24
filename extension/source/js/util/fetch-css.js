// TODO use  chrome.tabs.insertCSS

// We request CSS on behalf of the sitecues script in the page
// We need CSS so that we can essentially implement getElementsByComputedStyle
// which we need in order to find the fixed position elements on the page that do not respond to zoom properly
'use strict';

window.addEventListener('RequestCss', function (requestEvent) {
  var xhr = new XMLHttpRequest(),
    id = requestEvent.detail.id;  // Fire a different response event back for each request
  xhr.onerror = function (/*xhrEvent*/) {
    window.dispatchEvent(new CustomEvent('ProcessCss-' + id));
  };
  xhr.onload = function (xhrEvent) {
    var contentType = this.getResponseHeader('content-type');
    if (!contentType || contentType.indexOf('text/css') !== 0) {
      xhr.onerror(event);
    }
    else {
      window.dispatchEvent(new CustomEvent('ProcessCss-' + id, {detail: xhrEvent.target.responseText}));
    }
  };
  xhr.open('GET', requestEvent.detail.url);  // event.detail holds the URL for the .css file we need
  try {
    xhr.send();
  } catch (ex) {
    xhr.onerror();
  }
});
