!function() {
  "use strict";
  function refreshDisabledState() {
    chrome.tabs.sendMessage(window.currentTabId, {
      action: "isDisabled"
    }, function(response) {
      var r = response || {};
      document.getElementById("onoff").innerText = r.isDisabled ? "Enable for site" : "Disable for site";
    });
  }
  function toggleEnabled() {
    chrome.tabs.sendMessage(window.currentTabId, {
      action: "toggleDisabled"
    });
  }
  chrome.runtime.onMessage.addListener(function(request) {
    if ("refreshDisabledState" === request.action) {
      refreshDisabledState();
    }
  });
  chrome.tabs.query({
    currentWindow: true,
    // currently focused window
    active: true
  }, function(foundTabs) {
    if (foundTabs.length > 0) {
      var link = document.createElement("a");
      link.href = foundTabs[0].url;
      window.currentHostName = link.hostname;
      window.currentTabId = foundTabs[0].id;
      refreshDisabledState();
    }
  });
  document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("onoff").addEventListener("click", toggleEnabled);
  });
}();