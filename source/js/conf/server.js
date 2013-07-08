// module for storing settings on the server
sitecues.def('conf/server', function (server, callback, log) {

	// URLs for loading/saving data
  var domain = location.hostname.replace(/^www\./, '');
	var saveUrl = '//' + sitecues.getCoreConfig().hosts.up + '/save/' + domain;
  var loadUrl = '//' + sitecues.getCoreConfig().hosts.up + '/load/' + domain;

  // UGH!!! The preferences server has a race condition that can clobber data! And ...
  // Redis has no transactions (at least it is web-scale). So, THIS code must ensure
  // that we don't have two simultaneous saves at the same time. Also, we can't
  // just save ALL config data, as that would save the site IDs, etc... which
  // we don't want to save. Our config management needs work...
  var SAVING_DATA = false;

	sitecues.use('conf', 'load', 'jquery', function(conf, load, jquery){

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
        var data = {};
        data[key] = value;
        jquery.ajax({
          type: 'POST',
          url: saveUrl,
          data: data,
          complete: function() {
            SAVING_DATA = false;
          }
        })
      }
    };

    // Load the server data.
    jquery.ajax({
      type: 'GET',
      url: loadUrl,
      success: function(data) {
        // Set the obtained config data.
        conf.data(data);
        // Update the preferences server on every 'set'.
        conf.get('*', function(key, value) {
          saveData(key, value);
        });
      },
      complete: function() {
        callback();
      }
    });
	});
});
