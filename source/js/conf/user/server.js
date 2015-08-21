/**
 * This module is responsible for reading/persisting user configuration to/from the
 * server
 */
define(['conf/user/manager', 'util/localstorage', 'jquery'], function(manager, ls, $) {

  'use strict';

  // URLs for loading/saving data
  var lsByUserId;
  var params = '/' + location.hostname + '?callback=?';
  var saveUrl = sitecues.getPrefsUrl('save') + params;
  var loadUrl = sitecues.getPrefsUrl('load') + params;

  // UGH!!! The preferences server has a race condition that can clobber data! And ...
  // Redis has no transactions (at least it is web-scale). So, THIS code must ensure
  // that we don't have two simultaneous saves at the same time.
  //
  // Our config management needs work...
  var SAVING_DATA = false;

  // JSONP callback called when a save call returns.

  var saveTimeoutId;

  function saveCallback() {
    saveTimeoutId && clearTimeout(saveTimeoutId);
    SAVING_DATA = false;
  }

  // Saves a key/value pair.
  function saveData(key, value) {

    // Skip this try if we are in the middle of saving something.
    if (SAVING_DATA) {
      setTimeout(function() {
        saveData(key, value);
      }, 0);
    } else {
      // Save the data.
      SAVING_DATA = true;

      // Set up the data.
      var data = {};
      data[key] = value;

      // Set a save set timeout.
      saveTimeoutId = setTimeout(function() {
        saveCallback();
      }, 500);

      // Load the data from localStorage: User ID namespace.
      lsByUserId = ls.getUserPreferencesById(); // String.
      if (lsByUserId) {
        ls.setUserPreferenceById(key, value);
        saveCallback();
      }

      if (SC_LOCAL) {
        // Cannot save to server when we have no access to it
        // Putting this condition in allows us to paste sitecues into the console
        // and test it on sites that have a content security policy
        saveCallback();
        return;
      }

      // Save the server data.
      $.ajax({
        type: 'GET',
        url: saveUrl,
        data: data,
        async: true,
        contentType: 'application/json',
        dataType: 'jsonp',
        success: function() {
          saveCallback();
        },
        error: function(e) {
          if (SC_DEV) {
            console.info('Unable to persist server config (' + key + '=' + value + '): ' + e.message);
          }
          saveCallback();
        }
      });
    }
  }

  // JSONP callback called when a load call returns.
  var loadTimeoutID;
  var initialized = false;
  function loadCallback(data) {
    loadTimeoutID && clearTimeout(loadTimeoutID);
    // Set the obtained config data (if any).
    data && manager.data(data);

    if (!initialized) {
      initialized = true;

      // server.initialUserDataReturned = true;

      // Update the preferences server on every 'set'.
      manager.get('*', function(key, value) {
        saveData(key, value);
      });

      sitecues.emit('conf/did-complete');
    }
  }

  // Load the data from localStorage: User ID namespace.
  lsByUserId = ls.getUserPreferencesById();
  if (lsByUserId) {
    loadCallback(lsByUserId);
  } else {
    if (SC_LOCAL) {
      // Cannot save to server when we have no access to it
      // Putting this condition in allows us to paste sitecues into the console
      // and test it on sites that have a content security policy
      ls.setUserPreferencesById({});
      loadCallback();
      return;
    }

    // Load the server data.
    $.ajax({
      type: 'GET',
      url: loadUrl,
      async: false,
      contentType: 'application/json',
      dataType: 'jsonp',
      success: function(data) {
        ls.setUserPreferencesById(data);
        loadCallback(data);
      },
      error: function(e) {
        if (SC_DEV) {
          console.warn('Unable to load server config: ' + e.message);
        }
        loadCallback();
      }
    });
  }
  // No publics
});
