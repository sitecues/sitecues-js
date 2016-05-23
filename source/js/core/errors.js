/**
 * Error logger -- sends errors to Sitecues servers for analysis. Requires <script crossorigin="anonymous">
 * - Not currently used in extension
 * - Does not require init() so that it's easier to add/remove in different builds
 */
define(['core/metric', 'core/conf/urls'], function(metric, urls) {
  function isSitecuesError(source) {
    return urls.parseUrl(source).origin === urls.getScriptOrigin();
  }

  function logError(detail, doLogToConsole) {
    if (doLogToConsole) {
      console.log('%cSitecues Error %s', 'color: orange', detail.message);
      if (detail.stack) {
        console.log(detail.stack);
      }
    }

    // detail object contains everything we need (message, line, col, etc.)
    metric.init();
    new metric.Error(detail).send();
  }

  function onError(event) {
    var error = event.error,
      filename = event.filename;

    if (!error || !filename || !isSitecuesError(filename)) {
      // We only care about Sitecues errors
      return;
    }

    logError({
      message: error.message,
      filename: filename, // JS file with error
      lineno: event.lineno,
      colno: event.colno,
      stack: error.stack
    });
  }


  function onPromiseCaught(event) {
    var detail = event.detail;
    logError( {
      message: detail.message,
      stack: detail.stack
    }, true);
  }

  window.addEventListener('error', onError, true);   // May get both JS and resource errors
  window.addEventListener('SitecuesPromiseError', onPromiseCaught, true);   // Thrown from prim library
});
