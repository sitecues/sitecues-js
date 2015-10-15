/**
 * This module is responsible for reading/persisting user configuration to/from the
 * server
 *
 * IMPORTANT: we only save one piece of data at a time:
 *    // TODO old note from Brian Watson:
 -    // UGH!!! The preferences server has a race condition that can clobber data! And ...
 -    // Redis has no transactions (at least it is web-scale). So, THIS code must ensure
 -    // that we don't have two simultaneous saves at the same time.
 -    // Our config management needs work...
 -    //
 -    // If we try to save more than one thing in quick succession, it will get lost
 */
define(['core/conf/user/manager', 'core/conf/urls', 'core/conf/user/localstorage'], function(manager, urls, ls) {

  // URLs for loading/saving data
  var
    lsByUserId,
    isInitialized,
    // JSONP callback called when a load call returns.
    timeoutId,
    TIMEOUT_MS = 500,
    saveFifoQueue = [];  // Data to save -- first in first out

  function initJsonp(type, additionalParams, callbackFn) {
    sitecues.jsonpCallback = callbackFn;
    var scriptEl = document.createElement('script'),
      // We only need one callback because we only do one at a time
      params = '/' + location.hostname + '?callback=sitecues.jsonpCallback&' + additionalParams,
      url = urls.getPrefsUrl(type) + params;

    console.log('jsonp url: ' + url);
    scriptEl.setAttribute('src', url);
    scriptEl.id = 'sitecues-jsonp';
    document.querySelector('head').appendChild(scriptEl);

    timeoutId = setTimeout(callbackFn, TIMEOUT_MS);
  }

  function cleanupJsonp() {
    clearTimeout(timeoutId);
    var oldScriptEl = document.getElementById('sitecues-jsonp');
    if (oldScriptEl) {
      oldScriptEl.parentNode.removeChild(oldScriptEl);
    }
    delete sitecues.jsonpCallback;
  }

  function saveToServerCallback() {
    cleanupJsonp();

    // Get next data to save from queue, if any
    var newData = saveFifoQueue.shift();
    if (newData) {
      saveDataToServer(newData.key, newData.value);
    }
  }

  // Saves a key/value pair.
  function saveData(key, value) {

    // Save the data from localStorage: User ID namespace.
    ls.setPref(key, value);

    // Save the data to server as well
    saveDataToServer(key, value);
  }

  function saveDataToServer(key, value) {

    if (sitecues.jsonpCallback) {
      // Already saving something, must wait until current save is finished
      saveFifoQueue.push({key: key, value: value});
      return;
    }

    // Cannot save to server when we have no access to it
    // Putting this condition in allows us to paste sitecues into the console
    // and test it on sites that have a content security policy
    if (!SC_LOCAL) {
      initJsonp('save', encodeURIComponent(key) + '=' + encodeURIComponent(value), saveToServerCallback);
    }
  }

  // Reset all settings as if it is a new user
  function reset() {
    ls.clear();
  }

  // Received via jsonp from server
  function loadFromServerCallback(data) {
    cleanupJsonp();

    if (data) {
      ls.setPrefs(data);
    }

    loadCallback(data);
  }

  function loadCallback(data) {
    console.log('server#loadCallback');
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    // Set the obtained config data (if any).
    manager.data(data || {});

    settingsComplete();
  }

  function settingsComplete() {
    console.log('server#settingsComplete')
    sitecues.emit('conf/did-complete');
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    // Listen to every conf.set() call and persist new settings to server
    manager.get('*', function(key, value) {
      saveData(key, value);
    });

    console.log('server#init');

    // Load the data from localStorage: User ID namespace.
    lsByUserId = ls.getPrefs();
    console.log('lsByUserId ' + JSON.stringify(lsByUserId));
    if (lsByUserId || SC_LOCAL) {
      console.log('server#init#localStorage');
      loadCallback(lsByUserId);
    }
    else {
      console.log('server#init#jsonp');
      // Load the server data.
      initJsonp('load', '', loadFromServerCallback);
    }
  }

  return {
    init: init,
    reset: reset
  };
});
