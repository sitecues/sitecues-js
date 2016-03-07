/**
 * This module manages all user preferences. These
 * properties represent the state of the user session, and are
 * persisted in the user preferences data store.
 */
define(['core/conf/user/storage', 'core/conf/user/storage-backup', 'core/util/uuid'], function (storage, storageBackup, uuid) {
  // private variables
  var handlers       = {},
      listeners      = {};

  function getUserId() {
    return storage.getUserId();
  }

  // get preferences value
  function get(key, callback) {

    // handle sync getting of value
    var settings = storage.getPrefs(),
      value = settings[key];

    if (!callback) {
      return value;
    }

    // private variables
    listeners[key] = listeners[key] || [];

    // push callback to listeners list
    listeners[key].push(callback);

    if (settings.hasOwnProperty(key)) {
      // call back if there is value for key (no immediate callback for settings that are not yet defined)
      callback(value);
    }
  }

  // set preferences value (or pass undefined to unset)
  function set(key, value) {
    // private variables
    var list,
      index = 0,
      numListeners,
      oldValue = get(key);

    // call handler if needed
    // if undefined, we are unsetting the value, and do need to go through the conf.def handler
    if (typeof value !== 'undefined' && handlers[key]) {
      value = handlers[key](value);
    }

    // value isn't changed
    if (value === oldValue) {
      return;
    }

    // if list isn't empty, call each listener
    // about new value
    list = listeners[key];
    if (list) {
      numListeners = list.length;
      for (; index < numListeners; index++) {
        list[index](value);
      }
    }

    // Save the data from localStorage: User ID namespace.
    storage.setPref(key, value);
    //Save data to storage backup
    saveToBackup();
  }

  function unset(key) {
    set(key, undefined);
  }

  function saveToBackup() {
    storageBackup.save(storage.getRawAppData());
  }

  // define key handler
  function def(key, handler) {
    // set handler for key
    if ('function' === typeof handler) {
      handlers[key] = handler;
    }
  }

  // Reset all settings as if it is a new user
  function reset() {
    // Undefine all settings and call setting notification callbacks
    var allSettings = Object.keys(storage.getPrefs());
    allSettings.forEach(function(settingName) {
      unset(settingName);
    });

    // Some settings have a default value -- we'll clear everything except for user id now
    saveToBackup();
  }

  function init(onReadyCallbackFn) {

    var retrievedSettings;

    retrievedSettings = storage.getPrefs();

    if (Object.keys(retrievedSettings).length) {
      onReadyCallbackFn();
    }
    else {
      // Could not find local storage for sitecues prefs
      // Try cross-domain backup storage
      storageBackup.init(function () {
        storageBackup.load(function (data) {
          if (data) {
            storage.setAppData(data);
          }
          else {
            // No user id: generate one
            var userId = uuid();
            storage.setUserId(userId);
            saveToBackup();
          }
          onReadyCallbackFn();
        });
      });
    }

  }

  return {
    init: init,
    getUserId: getUserId,
    get: get,
    set: set,
    def: def,
    reset: reset
  };
});
