/**
 * Error logger -- sends errors to Sitecues servers for analysis. Requires <script crossorigin="anonymous">
 * - Not currently used in extension
 * - Does not require init() so that it's easier to add/remove in different builds
 */
define(['core/metric', 'core/conf/urls'], function(metric, urls) {
  function isSitecuesError(source) {
    return urls.parseUrl(source).origin === urls.getScriptOrigin();
  }

  function onError(event) {
    var error = event.error,
      filename = event.filename;

    if (!error || !filename || !isSitecuesError(filename)) {
      // We only care about Sitecues errors
      return;
    }

    metric.init();
    var details = {
      message: error.message,
      source: filename, // JS file with error
      lineno: event.lineno,
      colno: event.colno,
      stack: error.stack
    };

    // error object already contains everything we need (message, line, col, etc.)
    new metric.Error(details).send();
  }

  window.addEventListener('error', onError, true);   // May get both JS and resource errors
});
