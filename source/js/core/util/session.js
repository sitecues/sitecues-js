define(['core/util/uuid'], function(uuid) {
  var
    exports = {
      sessionId: null,
      pageViewId: null,
      init: init
    },
    SESSION_ID_KEY = '-sc-session-id';

  function isChildPage() {
    return window.top !== window && sitecues.parentConfig;
  }

  function getParentPageViewId() {
    if (isChildPage()) {
      return sitecues.parentConfig.pageViewId;
    }
  }

  function getParentSessionId() {
    if (isChildPage()) {
      return sitecues.parentConfig.sessionId;
    }
  }

  function getPrevSessionId() {
    return window.sessionStorage.getItem(SESSION_ID_KEY);
  }

  function getReusableSessionId() {
    return getParentSessionId() || getPrevSessionId();

  }

  function createSessionId() {
    var sessionId = uuid();
    // Save session id and save for future page views of this site in this tab
    window.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    return sessionId;
  }

  function init(options) {
    // Use session id and page view id from parent page if available
    exports.sessionId  = (options.isSameUser && getReusableSessionId()) || createSessionId();
    exports.pageViewId = getParentPageViewId() || uuid();
  }

  return exports;
});