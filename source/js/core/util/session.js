define(['core/util/uuid'], function(uuid) {
  var SESSION_ID_KEY = '-sc-session-id',
    // Use session id and page view id from parent page if available
    sessionId = getParentSessionId() || getPrevSessionId() || createSessionId(),
    pageViewId = getParentPageViewId() || uuid();

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

  function createSessionId() {
    var sessionId = uuid();
    // Save session id and save for future page views of this site in this tab
    window.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    return sessionId;
  }

  return {
    sessionId: sessionId,
    pageViewId: pageViewId
  };
});