define([
  'core/conf/manager'
], function(
  conf
) {
  var
    exports = {
      sessionId: null,
      pageViewId: null,
      init: init
    };

  function getPageViewId() {
    return sitecues.pageView.id;
  }

  function getSessionId() {
    return sitecues.session.id;
  }

  function init() {
    // Use session id and page view id from parent page if available
    exports.sessionId  = getSessionId();
    exports.pageViewId = getPageViewId();
    exports.userId = conf.getUserId();
  }

  return exports;
});