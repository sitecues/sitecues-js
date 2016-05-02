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
      console.log('%cSitecues Error: %o', 'color: orange', detail);
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
      source: filename, // JS file with error
      lineno: event.lineno,
      colno: event.colno,
      stack: error.stack
    });
  }


  function onPromiseCaught(event) {
    logError(event.detail, true);
  }

  window.addEventListener('error', onError, true);   // May get both JS and resource errors
  window.addEventListener('SitecuesPromiseError', onPromiseCaught, true);   // Thrown from prim library
});
