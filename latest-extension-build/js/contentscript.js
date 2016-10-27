/**
 * sitecues everywhere script
 * This needs to load before any web page sitecues script.
 * We do this by inserting our <script> elements as early as possible in the DOM,
 * and by using run_at="document_start"
 **/
// TODO better close button
// TODO can anything be removed from permissions? Do we need 'tabs' ?
// TODO TTS
// TODO image reversal
"use strict";

// Put jQuery $ in local scope for extension
// jshint -W098
var $ = sitecues.$;

if (!window.localStorage.getItem("sitecues-disabled")) {
  document.documentElement.setAttribute("data-sitecues-everywhere", "");
}

chrome.extension.sendMessage({
  action: "closeSitecuesPopup"
});

chrome.runtime.sendMessage({
  action: "refreshDisabledState",
  isDisabled: window.isDisabled
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if ("isDisabled" === request.action) {
    sendResponse({
      isDisabled: window.isDisabled
    });
  } else {
    if ("toggleDisabled" === request.action) {
      window.isDisabled = !window.isDisabled;
      window.localStorage.setItem("sitecues-disabled", window.isDisabled ? "true" : "false");
      window.location.reload();
    }
  }
});