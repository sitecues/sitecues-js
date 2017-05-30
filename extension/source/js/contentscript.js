/**
 * sitecues everywhere script
 * This needs to load before any web page sitecues script.
 * We do this by inserting our <script> elements as early as possible in the DOM,
 * and by using run_at="document_start"
 **/

// TODO can anything be removed from permissions? Do we need 'tabs' ?
// TODO image reversal

'use strict';

// Put jQuery $ in local scope for extension
// jshint -W098
var $ = sitecues.$;

// Signal to the in-page script that Sitecues Everywhere is present
// This attribute will be set to 'on' if Sitecues Everywhere is not disabled for this page
document.documentElement.setAttribute('data-sitecues-everywhere', '');

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action === 'setPaused') {
      var isPaused = request.isPaused;
      window.sitecues.setDisabledGlobally(isPaused);
    }
  }
);


