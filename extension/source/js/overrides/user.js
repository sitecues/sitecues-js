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

    function assign(data) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          }
          else {
            resolve();
          }
        });
      });
    }

    function getAll() {
      return new Promise((resolve, reject) => {
        // Passing in null gets the entire contents of storage
        chrome.storage.local.get(null, (storage) => {
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
        assign,
        getAll
      },
      getId
    };
  });