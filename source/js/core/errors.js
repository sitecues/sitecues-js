/**
 * Error logger -- sends errors to Sitecues servers for analysis. Requires <script crossorigin="anonymous">
 * - Not currently used in extension
 * - Does not require init() so that it's easier to add/remove in different builds
 */
define(['core/metric', 'core/conf/urls'], function(metric, urls) {
  function isSitecuesError(source) {
    return urls.parseUrl(source).origin === urls.getScriptOrigin();
  }

  function logError(detail) {
    console.log('%cSitecues Error %s', 'color: orange', detail.message);
    if (detail.stack) {
      console.log(detail.stack);
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
      type: 'exception',
      message: error.message,
      filename: filename, // JS file with error
      lineno: event.lineno,
      colno: event.colno,
      stack: error.stack
    });
  }


  function onPrimRejection(event) {
    var detail = event.detail;
    logError( {
      type: 'prim rejection',
      message: detail.message,
      stack: detail.stack
    }, true);
  }

  function onNativeRejection(event) {
    // event.reason can be an object or value
    var reason = event.reason || {};
    logError({
      type: 'native promise rejection',
      message: reason.message || reason,
      stack: reason.stack
    });
  }

  function onRequireFailure(event) {
    var detail = event.detail;
    logError({
      type: 'require error',
      stack: detail.stack,
      message: 'Could not find module: ' + detail.requireModules
    });
  }

  window.addEventListener('error', onError);   // May get both JS and resource errors
  window.addEventListener('SitecuesUnhandledRejection', onPrimRejection);   // Thrown from prim library
  window.addEventListener('unhandledrejection', onNativeRejection);
  window.addEventListener('rejectionhandled', onNativeRejection);
  window.addEventListener('SitecuesRequireFailure', onRequireFailure);   // Thrown from prim library
});
