define(['jquery', 'audio/audio', 'conf/user/manager'], function ($, audio, conf) {

  'use strict';

  function format(object) {

    // Helper to turn objects into string representations for logging.

    var INDENTATION = '    ',
          result = object;

    if (JSON && JSON.stringify) {
      result = JSON.stringify(object, null, INDENTATION);
    }

    return result;
  }

  function consoleCallback(status) {

    // The default status formatter, logs all data to the console.

    // Make sure we are not running from a file (unit testing in node)...
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      // We only support the native console for now, so make sure it exists...
      if (console && console.log) {
        // Make it clear where to begin copying...
        console.log('\n-----BEGIN SITECUES STATUS-----\n');
        // Log with pretty-print, if possible...
        console.log(format(status));
        // Make it clear where to end copying...
        console.log('\n-----END SITECUES STATUS-----\n');
      }
    }
  }

  function status(callback) {

    var html = document.documentElement,
        confData = conf.data(),
        coordinates,
        ajaxUrls = {  // Set the server URLs for retrieving the status of our services (version info, etc.)
          up : sitecues.getPrefsUrl('status'),
          ws : sitecues.getApiUrl('util/status')
        },
        setting,
        state,
        info;

    callback = callback || consoleCallback;

    info = {
      'time'            : Date.now(),
      'current_url'     : location.href,
      'sitecues_js_url' : sitecues.getLibraryUrl().raw,
      'user_agent'      : navigator.userAgent,
      'version'         : {
        'sitecues_js'   : sitecues.getVersion(),
        'sitecues_up'   : null,
        'sitecues_ws'   : null
      }
    };
    // Measurements useful for reproducing bugs, because their state affects
    // the behavior of our CSS, animations, etc.
    coordinates = {
      'document'        : {
        'clientWidth'   : html.clientWidth,
        'clientHeight'  : html.clientHeight,
        'clientLeft'    : html.clientLeft,
        'clientTop'     : html.clientTop
      },
      'window'          : {
        'pageXOffset'   : pageXOffset,
        'pageYOffset'   : pageYOffset,
        'innerWidth'    : innerWidth,
        'innerHeight'   : innerHeight,
        'outerWidth'    : outerWidth,
        'outerHeight'   : outerHeight,
        'screenX'       : screenX,
        'screenY'       : screenY
      },
      'screen'          : {
        'width'         : screen.width,
        'height'        : screen.height,
        'availWidth'    : screen.availWidth,
        'availHeight'   : screen.availHeight,
        'availLeft'     : screen.availLeft,
        'availTop'      : screen.availTop
      }
    };

    // Add current settings (zoom level, etc) to the log.
    for (setting in confData) {
      if (confData.hasOwnProperty(setting)) {
        info[setting] = confData[setting];
      }
    }
    // Add all measurements for bug reproduction to the log.
    for (state in coordinates) {
      if (coordinates.hasOwnProperty(state)) {
        info[state] = coordinates[state];
      }
    }

    // Defer the ajax calls so we can respond when both are complete.
    function readyCheck() {
      var ready = typeof info.version.sitecues_up === 'string' &&
                  typeof info.version.sitecues_ws === 'string';

      if (ready) {
        // Publish the status for later retrieval.
        sitecues.latestStatus = info;
        callback(info);
      }
    }

    $.ajax({
      type:     'GET',
      dataType: 'json',
      cache:    false,
      url:      ajaxUrls.up,
      success: function (response) {
        // Set the version based on the AJAX response object
        info.version.sitecues_up = response.version;
        readyCheck();
      },
      error: function () {
        // Set an error message if the AJAX object did not return
        info.version.sitecues_up = 'Error fetching UP version from service URL';
        readyCheck();
      }
    });

    $.ajax({
      type:     'GET',
      dataType: 'json',
      cache:    false,
      url:      ajaxUrls.ws,
      success: function (response) {
        // Set the version based on the AJAX response object
        info.version.sitecues_ws = response.version;
        readyCheck();
      },
      error: function () {
        // Set an error message if the AJAX object did not return
        info.version.sitecues_ws = 'Error fetching WS version from service URL';
        readyCheck();
      }
    });
    return 'Fetching sitecues status...';
  }

  if (SC_UNIT) {
    module.exports.status = status;
  }

  return status;
});
