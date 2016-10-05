define(
  [
    'core/conf/urls',
    'core/util/xhr',
    'core/conf/user/manager',
    'core/conf/site',
    'nativeFn'
  ],
  function (
    urls,
    xhr,
    conf,
    site,
    nativeFn
  ) {
  'use strict';

    function format(object) {

      // Helper to turn objects into string representations for logging.

      var INDENTATION = '    ',
            result = object;

      if (nativeFn.JSON && nativeFn.JSON.stringify) {
        result = nativeFn.JSON.stringify(object, null, INDENTATION);
      }

      return result;
    }

    function consoleCallback(status) {

      // The default status reporter, logs all data to the console.

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
          prefData = conf.get(),
          coordinates,
          ajaxUrls = {  // Set the server URLs for retrieving the status of our services (version info, etc.)
            ws : urls.getApiUrl('util/status')
          },
          setting,
          state,
          info;

      callback = callback || consoleCallback;

      info = {
        time       : Date.now(),
        currentUrl : location.href,
        userAgent  : navigator.userAgent,
        version    : {
          js : sitecues.version,
          ws : null
        },
        config     : site.getSiteConfig()
      };
      // Measurements useful for reproducing bugs, because their state affects
      // the behavior of our CSS, animations, etc.
      coordinates = {
        document : {
          clientWidth  : html.clientWidth,
          clientHeight : html.clientHeight,
          clientLeft   : html.clientLeft,
          clientTop    : html.clientTop
        },
        window : {
          pageXOffset  : pageXOffset,
          pageYOffset  : pageYOffset,
          innerWidth   : innerWidth,
          innerHeight  : innerHeight,
          outerWidth   : outerWidth,
          outerHeight  : outerHeight,
          screenX      : screenX,
          screenY      : screenY
        },
        screen : {
          width        : screen.width,
          height       : screen.height,
          availWidth   : screen.availWidth,
          availHeight  : screen.availHeight,
          availLeft    : screen.availLeft,
          availTop     : screen.availTop
        }
      };

      // Add current settings (zoom level, etc) to the log.
      for (setting in prefData) {
        if (prefData.hasOwnProperty(setting)) {
          info[setting] = prefData[setting];
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
        var ready = typeof info.version.ws === 'string';

        if (ready) {
          // Publish the status for later retrieval.
          sitecues.status.latest = info;
          callback(info);
        }
      }

      if (SC_LOCAL) {
        callback(info); // Avoid xhr in local mode (including extension)
      }
      else {
        xhr.getJSON({
          type: 'GET',
          url: ajaxUrls.ws,
          success: function (response) {
            // Set the version based on the AJAX response object
            info.version.ws = response.version;
            readyCheck();
          },
          error: function () {
            // Set an error message if the AJAX object did not return
            info.version.ws = 'Error fetching WS version from service URL';
            readyCheck();
          }
        });
      }

      return 'Fetching Sitecues status...';
    }

    return status;
  }
);
