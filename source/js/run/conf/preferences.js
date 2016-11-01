define(
  [
    'mini-core/user',
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

    if (handlers[key]) {
      safeValue = handlers[key](value);
    }
    else {
      safeValue = value;
    }

    if (listeners[key]) {
      listeners[key].forEach(function (listener) {
        listener(safeValue);
      });
    }

    cachedPrefs[key] = safeValue;

    user.prefs.setAll(cachedPrefs);
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