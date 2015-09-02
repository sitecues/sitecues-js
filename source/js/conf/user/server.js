/**
 * This module is responsible for reading/persisting user configuration to/from the
 * server
 */
define(['conf/user/manager', 'util/localstorage'], function(manager, ls) {

  // URLs for loading/saving data
  var
    lsByUserId,
    params = '/' + location.hostname + '?callback=x?',
    saveUrl = sitecues.getPrefsUrl('save') + params,
    loadUrl = sitecues.getPrefsUrl('load') + params,
    saveTimeoutId,   // JSONP callback called when a save call returns.
    isInitialized,
    // TODO old note from Brian Watson:
    // UGH!!! The preferences server has a race condition that can clobber data! And ...
    // Redis has no transactions (at least it is web-scale). So, THIS code must ensure
    // that we don't have two simultaneous saves at the same time.
    // Our config management needs work...
    isSavingData,
    // JSONP callback called when a load call returns.
    loadTimeoutID,
    isComplete = false;


  function saveCallback() {
    saveTimeoutId && clearTimeout(saveTimeoutId);
    isSavingData = false;
  }

  // Saves a key/value pair.
  function saveData(key, value) {

    // Skip this try if we are in the middle of saving something.
    if (isSavingData) {
      setTimeout(function() {
        saveData(key, value);
      }, 0);
    } else {
      // Save the data.
      isSavingData = true;

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

      require(['util/xhr'], function(xhr) {
        // Save the server data.
        xhr.getJSONP({
          type: 'GET',
          url: saveUrl,
          data: data,
          success: saveCallback,
          error: function (e) {
            if (SC_DEV) {
              console.info('Unable to persist server config (' + key + '=' + value + '): ' + e.message);
            }
            saveCallback();
          }
        });
      });
    }
  }

  function loadCallback(data) {
    loadTimeoutID && clearTimeout(loadTimeoutID);
    // Set the obtained config data (if any).
    data && manager.data(data);

    if (!isComplete) {
      isComplete = true;

      // server.initialUserDataReturned = true;

      // Update the preferences server on every 'set'.
      manager.get('*', function(key, value) {
        saveData(key, value);
      });

      sitecues.emit('conf/did-complete');
    }
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    // Load the data from localStorage: User ID namespace.
    lsByUserId = null; //ls.getUserPreferencesById();
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
      require(['util/xhr'], function (xhr) {
        xhr.getJSONP({
          url: loadUrl,
          success: function (data) {
            ls.setUserPreferencesById(data);
            loadCallback(data);
          },
          error: function (e) {
            if (SC_DEV) {
              console.warn('Unable to load server config: ' + e.message);
            }
            loadCallback();
          }
        });
      });
    }
  }

  return {
    init: init
  };
});
