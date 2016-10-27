/**
 * Partial mini-core/user implementation (the subset we need)
 * Implements same API but uses chrome.storage.local for the storage, which will persist across sites.
 * Note: we could use chrome.storage.sync if we actually wanted settings to be saved across devices,
 * but we probably don't since devices can have very different screen sizes and uses.
 */
/*
 * Example what we store:
 *
 * {
 *   "firstHighZoom":1408448995870,
 *   "zoom":1.1,
 *   "ttsOn":false,
 *   "firstSpeechOn": 1406131476374
 * }
 *
 */

define(
  'mini-core/user',
  [
  ],
  function (
  ) {
    'use strict';

    function assignPrefs(data) {
      return new Promise(function(resolve, reject) {
        chrome.storage.local.set(data, function() {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          }
          else {
            resolve();
          }
        });
      });
    }

    function getAllPrefs() {
      return new Promise(function(resolve, reject) {
        // Passing in null gets the entire contents of storage
        chrome.storage.local.get(null, function (storage) {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          }
          else {
            resolve(storage || {});
          }
        });
      });
    }

    function getId() {
      return Promise.resolve('user-123');  // User ids not currently relevant in the extension (no metrics)
    }

    return {
      prefs: {
        assign: assignPrefs,
        getAll: getAllPrefs
      },
      getId: getId
    };
  });