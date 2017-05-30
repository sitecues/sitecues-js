/**
 * Css Fetch background script
 * Runs at a higher level of permission and can fetch CSS with running into cross-origin conflicts
 *
 * Fetch CSS via something like:
 * function onCssRetrieved(cssText) {
 * }
 * chrome.runtime.sendMessage({ action: "fetchCss", url: url }, onCssRetrieved);
 **/

'use strict';

/**
 *  Get pixel info for an image url
 */

(function() {

  function fetchCss(url) {
    return window.fetch(url)
      .then(function(response) {
        if (response.status >= 400) {
          throw new Error(response.statusText);
        }
        const contentType = response.headers.get('Content-Type').split(';')[0];
        if (contentType !== 'text/css' && contentType !== 'text/plain') {
          throw new Error('Incorrect Content-Type header for CSS; acceptable types are text/css or text/plain, was ' + contentType);
        }
        return response.text();
      });
  }

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'fetchCss') {
      fetchCss(message.url)
        .then(function(cssText) {
          console.log(cssText);
          sendResponse(cssText);
        })
        .catch(function() {
          console.warn('CSS unavailable for ', message.url);
          sendResponse(); // Pixel info unavailable
        });
      }
      return true;
    }
  );

})();

