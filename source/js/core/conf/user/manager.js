/**
 * This module manages all user preferences. These
 * properties represent the state of the user session, and are
 * persisted in the user preferences data store.
 */
define(
  [
    'core/conf/user/storage',
    'core/conf/user/storage-backup',
    'nativeFn'
  ],
  function (
    storage,
    storageBackup,
    nativeFn
  ) {
  'use strict';

  // private variables
  var handlers       = {},
      listeners      = {};

  function getUserId() {
    return window.user.id;
  }

  function copyFields(obj) {
    return nativeFn.JSON.parse(nativeFn.JSON.stringify(obj));
  }

  // get preferences value(s)
  // key is optional -- if not provided returns all settings
  // callback is optional -- if provided is called back for initial setting and whenever setting changes
  function get(key, callback) {

    // handle sync getting of value
    var settings = copyFields(storage.getPrefs()), // For safety, ensure we don't pass back object that we don't want written to
      value;

    if (!key) {
      return settings;
    }

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

  function has(key) {
    return typeof get(key) !== 'undefined';
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

    // Save the data from localStorage: User ID namespace.
    storage.setPref(key, value);

    // if list isn't empty, call each listener
    // about new value
    list = listeners[key];
    if (list) {
      numListeners = list.length;
      for (; index < numListeners; index++) {
        list[index](value);
      }
    }

    //Save data to storage backup
    saveToBackup();
  }

  function unset(key) {
    set(key, undefined);
  }

  function saveToBackup() {
    storageBackup.save(storage.getAppData())
      .catch(function(error) {
        throw new Error(error);   // TODO find a cleaner way to log our errors/rejections once we move to native promises
      });
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
    allSettings.forEach(unset);
  }

  return {
    getUserId: getUserId,
    get: get,
    has: has,
    set: set,
    def: def,
    reset: reset
  };
});
