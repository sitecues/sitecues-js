'use strict';

function getPaused() {
  return new Promise(function(resolve, reject) {
    // Passing in null gets the entire contents of storage
    var KEY = 'isDisabledGlobally';
    chrome.storage.local.get(KEY, function (storage) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      else {
        resolve(storage[KEY] || false);
      }
    });
  });
}

function refreshPauseButtonLabel(isPaused) {
  var labelSuffix = ' across all sites';
  document.getElementById('onoff').innerText =
    (isPaused ? 'Unpause' : 'Pause') + labelSuffix;
}

function togglePaused() {
  return getPaused()
    .then(function(wasPaused) {
      var isPaused = !wasPaused;
      // Refresh button label
      refreshPauseButtonLabel(isPaused);
      // Close popup
      window.close();
      // Refresh tabs with new state
      var message = {action: 'setPaused', isPaused: isPaused };
      chrome.tabs.query({}, function (tabs) {
        var index = tabs.length;
        while (index --) {
          chrome.tabs.sendMessage(tabs[index].id, message);
        }
      });
    });
}

document.addEventListener(
  'DOMContentLoaded', function () {
    document.getElementById('onoff').addEventListener('click', togglePaused);
  }
);

getPaused()
  .then(refreshPauseButtonLabel);
