/**
 * Overrides core/conf/user/store-backup implementation
 * Implements same API but uses chrome.storage.local for the backup storage.
 * Note: we could use chrome.storage.sync if we really wanted settings to be saved across devices,
 * but we probably don't since devices can have very different screen sizes and uses.
 */
define('core/conf/user/storage-backup', [], function() {
  function save(data) {
    chrome.storage.local.set({'sitecues': data });
  }

  function load(onDataAvailableFn) {
    chrome.storage.local.get('sitecues', function (storage) {
      onDataAvailableFn(storage.sitecues ? JSON.parse(storage.sitecues) : {});
    });
  }

  function init(onReadyCallback) {
    // Nothing to do
    onReadyCallback();
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

