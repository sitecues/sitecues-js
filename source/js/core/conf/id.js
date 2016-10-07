define(
  [
    'core/conf/manager'
  ],
  function(
    conf
  ) {
  'use strict';

  var
    exports = {
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
    exports.session  = getSessionId();
    exports.pageView = getPageViewId();
    exports.user     = conf.getUserId();
    exports.site     = null;
  }

  return exports;
});
