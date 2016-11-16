define(
  [
    'core/user',
    'run/util/object-utility'
  ],
  function (
    user,
    objectUtil
  ) {
  'use strict';

  var cachedPrefs,
      handlers  = {},
      listeners = {};

  // Listeners are passed new preference values once they've been handled
  function bindListener(key, listener) {
    var prefValue = getPref(key);

    if (typeof prefValue !== 'undefined') {
      // Here we're perpetuating a pattern from the previous module design, if the
      // value has already been defined when we bind this listener, call the listener
      // with the current value. It's a little funky
      listener(prefValue);
    }

    listeners[key] = listeners[key] || [];
    listeners[key].push(listener);
  }

  // Handlers are passed new preference values, and the return value is saved and passed to
  // listeners to the preference
  function defineHandler(key, handler) {
    // set handler for key
    if (typeof handler === 'function') {
      handlers[key] = handler;
    }
  }

  // If callback is defined,
  function getPref(key) {
    if (!key) {
      return objectUtil.assign({}, cachedPrefs);
    }
    return cachedPrefs[key];
  }

  function setPref(key, value) {
    var safeValue;

    // Get the valid, corrected value (e.g. zoom=undefined ==> zoom=1, zoom=4 ==> zoom=3)
    if (handlers[key]) {
      safeValue = handlers[key](value);
    }
    else {
      safeValue = value;
    }

    // Save to the cachedPrefs which is also used to retrieve prefs quickly
    cachedPrefs[key] = safeValue;

    // Save to persistent storage.
    // We don't listen to the Promise returned by user.prefs.setAll,
    // because we don't actually care about the success or timing of saving to persistant storage.
    // Any client code that gets a pref will retrieve it from cachedPrefs, which is altered synchronosuly.
    user.prefs.setAll(cachedPrefs);

    // Call listeners
    if (listeners[key]) {
      listeners[key].forEach(function (listener) {
        listener(safeValue);
      });
    }
  }

  function unset(key) {
    setPref(key, undefined);
  }

  // Reset all settings as if it is a new user
  function resetPrefs(blackListSet) {
    function isNotBlackListed(key) {
      return !blackListSet.has(key);
    }

    // Undefine all settings and call setting notification callbacks
    Object.keys(cachedPrefs).filter(isNotBlackListed).forEach(unset);
  }

  function hasPref(key) {
    return Boolean(cachedPrefs[key]);
  }

  function isSitecuesUser() {
    return hasPref('zoom') || hasPref('ttsOn');
  }

  function isValid() {
    return Boolean(cachedPrefs);
  }

  function init() {
    return user.prefs.getAll().then(function (prefs) {
      cachedPrefs = prefs;
    });
  }

  return {
    get           : getPref,
    set           : setPref,
    has           : hasPref,
    isSitecuesUser: isSitecuesUser,
    reset         : resetPrefs,
    defineHandler : defineHandler,
    bindListener  : bindListener,
    isValid       : isValid,
    init          : init
  };
});
