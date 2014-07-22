/**
 * This module is responsible for reading/persisting user configuration to/from the
 * server
 */
sitecues.def('conf/user/server', function (server, callback) {

  // URLs for loading/saving data
	var saveUrl = '//' + sitecues.getLibraryConfig().hosts.up + '/save/' + location.hostname + '?callback=?';
  var loadUrl = '//' + sitecues.getLibraryConfig().hosts.up + '/load/' + location.hostname + '?callback=?';

  // UGH!!! The preferences server has a race condition that can clobber data! And ...
  // Redis has no transactions (at least it is web-scale). So, THIS code must ensure
  // that we don't have two simultaneous saves at the same time.
  //
  // Our config management needs work...
  var SAVING_DATA = false;

  // server.initialUserDataReturned = false;

	sitecues.use('conf/user/manager', 'jquery', function(manager, jquery){
    // JSONP callback called when a save call returns.

    var saveTimeoutId;
    
    var saveCallback = function() {
      saveTimeoutId && clearTimeout(saveTimeoutId);
      SAVING_DATA = false;
    };

    // Saves a key/value pair.
    var saveData = function (key, value) {

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
        saveTimeoutId = setTimeout( function () {
          saveCallback()
        }, 500);

        jquery.ajax({
          type: 'GET',
          url: saveUrl,
          data: data,
          async: true,
          contentType: "application/json",
          dataType: 'jsonp',
          success: function () {
            saveCallback();
          },
          error: function (e) {
            if (SC_DEV){
              console.info("Unable to persist server config (" + key + "=" + value + "): " + e.message);
            }
            saveCallback();
          }
        })
      }
    };

    // JSONP callback called when a load call returns.
    var loadTimeoutID;
    var initialized = false;
    var loadCallback = function (data) {
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

        callback();
      }
    };

    // Load the server data.
    jquery.ajax({
      type: 'GET',
      url: loadUrl,
      async: false,
      contentType: "application/json",
      dataType: 'jsonp',
      success: function (data) {
        loadCallback(data);
      },
      error: function (e) {
        if (SC_DEV){
          console.warn("Unable to load server config: " + e.message);
        }
        loadCallback();
      }
    });
  });
});
