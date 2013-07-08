// module for storing settings on the server
sitecues.def('conf/server', function (server, callback, log) {

  // URLs for loading/saving data
  var domain = location.hostname.replace(/^www\./, '');
	var saveUrl = '//' + sitecues.getCoreConfig().hosts.up + '/save/' + domain + '?callback=?';
  var loadUrl = '//' + sitecues.getCoreConfig().hosts.up + '/load/' + domain + '?callback=?';

  // UGH!!! The preferences server has a race condition that can clobber data! And ...
  // Redis has no transactions (at least it is web-scale). So, THIS code must ensure
  // that we don't have two simultaneous saves at the same time. Also, we can't
  // just save ALL config data, as that would save the site IDs, etc... which
  // we don't want to save. Our config management needs work...
  var SAVING_DATA = false;

	sitecues.use('conf/main', 'jquery', function(conf_main, jquery){

    // JSONP callback called when a save call returns.
    var saveTimeoutId;
    var saveCallback = function() {
      saveTimeoutId && clearTimeout(saveTimeoutId);
      SAVING_DATA = false;
    };

    // Saves a key/value pair.
    var saveData = function(key, value) {
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
          saveCallback()
        }, 500);

        jquery.ajax({
          type: 'GET',
          url: saveUrl,
          data: data,
          //async: false,
          contentType: "application/json",
          dataType: 'jsonp',
          success: function(data) {
            saveCallback();
          },
          error: function(e) {
            log.info("Unable to persist server config (" + key + "=" + value + "): " + e.message);
            saveCallback();
          }
        })
      }
    };

    // JSONP callback called when a load call returns.
    var loadTimeoutID;
    var initialized = false;
    var loadCallback = function(data) {
      loadTimeoutID && clearTimeout(loadTimeoutID);
      // Set the obtained config data (if any).
      data && conf_main.data(data);

      if (!initialized) {
        initialized = true;
        // Update the preferences server on every 'set'.
        conf_main.get('*', function(key, value) {
          saveData(key, value);
        });
        // This module has completed it's loading.
        callback();
      }
    };

    // Load the server data.
    jquery.ajax({
      type: 'GET',
      url: loadUrl,
      //async: false,
      contentType: "application/json",
      dataType: 'jsonp',
      success: function(data) {
        loadCallback(data);
      },
      error: function(e) {
        log.info("Unable to load server config: " + e.message);
        loadCallback();
      }
    });
	});
});
