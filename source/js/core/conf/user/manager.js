/**
 * This module manages all user configuration properties. These
 * properties represent the state of the user session, and are
 * persisted in the user preferences data store.
 */
define(['core/conf/user/storage'], function (storage) {
  // private variables
  var storedData = {},   // We cache in prefs in storedData for speed -- getting from localStorage is slower
      handlers  = {},
      listeners = {};

  // get configuration value
  function get(key, callback) {

    // handle sync getting of value
    if (!callback) {
      return storedData[key];
    }

    // private variables
    listeners[key] = listeners[key] || [];

    // push callback to listeners list
    listeners[key].push(callback);

    if (storedData.hasOwnProperty(key)) {
      // call back if there is value for key
      callback(storedData[key]);
    }
  }

  // set configuration value
  function set(key, value) {
    // private variables
    var list, i, l;

    // call handler if needed
    value = handlers[key] ? handlers[key](value) : value;

    // value isn't changed or is empty after handler
    if (typeof value === 'undefined' || value === storedData[key]) {
      return;
    }

    // save value, use handler if needed
    storedData[key] = value;

    // if list isn't empty, call each listener
    // about new value
    list = listeners[key];
    if (list) {
      l = list.length;
      for (i = 0; i < l; i++) {
        list[i](value);
      }
    }

    // Save the data from localStorage: User ID namespace.
    storage.setPref(key, value);
  }

  // define key handler
  function def(key, handler) {
    // set handler for key
    if ('function' === typeof handler) {
      handlers[key] = handler;
    }
  }

  // get/update all stored values
  function data(newData) {
    if (newData) {
      storedData = newData;
    }
    return storedData;
  }

  // Reset all settings as if it is a new user
  function reset() {
    storage.clear();
  }

  function init(onReadyCallbackFn) {
    storage.init(function(settings) {
      data(settings);
      onReadyCallbackFn();
    });
  }

  return {
    init: init,
    get: get,
    set: set,
    def: def,
    data: data,
    reset: reset
  };
});
