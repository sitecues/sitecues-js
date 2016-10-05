/**
 * Overrides core/conf/user/store-backup implementation
 * Implements same API but uses chrome.storage.local for the backup storage.
 * Note: we could use chrome.storage.sync if we really wanted settings to be saved across devices,
 * but we probably don't since devices can have very different screen sizes and uses.
 */
define('core/conf/user/storage-backup', [], function() {
  function save(data) {
    return new Promise(function(resolve) {
      chrome.storage.local.set(
        {'sitecues': data },
        resolve
      );
    });
  }

  function load() {
    return new Promise(function(resolve) {
      chrome.storage.local.get('sitecues', function (storage) {
        resolve(storage.sitecues || {});
      });
    });
  }

  function init() {
    // Nothing to do
  }

  function clear() {
    save('{}');
  }

  return {
    init: init,
    load: load,
    save: save,
    clear: clear
  };
});

