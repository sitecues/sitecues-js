sitecues.def('status', function (status_module, callback) {

  'use strict';

  sitecues.use('jquery', 'audio', 'conf', function ( $, audio, conf ) {

    // The default status formatter: simply log all data to the console log.
    function consoleCallback(info) {
      // Make sure we are not running from a file (unit testing in node)...
      if (location.protocol !== 'file:') {
        // We only support the native console for now, so make sure it exists...
        if (console && console.log) {
          // Make it clear where to begin copying...
          console.log('\n-----BEGIN SITECUES STATUS-----\n');
          // Check if we can pretty-print natively...
          if (JSON && JSON.stringify) {
            // Log with pretty-print
            console.log(JSON.stringify(info, null, '    '));
          }
          // If we don't have JSON or Stringify...
          else {
            // ...the output will not be quite so pretty...
            console.log(info);
          }
          // Make it clear where to end copying
          console.log('\n-----END SITECUES STATUS-----\n');
        }
      }
    }

    status_module = function (callback) {

      var data = conf.data(),
          coordinates,
          ajax_urls,
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
        },
      };

      coordinates = {
        'document'        : {
          'clientWidth'   : document.documentElement.clientWidth,
          'clientHeight'  : document.documentElement.clientHeight,
          'clientLeft'    : document.documentElement.clientLeft,
          'clientTop'     : document.documentElement.clientTop
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

      // Set the ajax URLs
      ajax_urls = {
        up : '//' + sitecues.getLibraryConfig().hosts.up + '/status',
        ws : '//' + sitecues.getLibraryConfig().hosts.ws + '/sitecues/api/util/status'
      };

      // Define the info object to be formatted by the log
      for (setting in data) {
        if (data.hasOwnProperty(setting)) {
          info[setting] = data[setting];
        }
      }
      for (state in coordinates) {
        if (coordinates.hasOwnProperty(state)) {
          info[state] = coordinates[state];
        }
      }

      // Appends sitecues status to the document in a div (useful for automated testing)
      function addStatusInfoToDOM() {
        var sitecuesStatusId='sitecues-status-output'
          , div = document.getElementById(sitecuesStatusId)
          ;

        if (div) {
          div.innerHTML = '';
        }
        else {
          div = document.createElement('div');
          div.setAttribute('id', 'sitecues-status-output');
          div.setAttribute('style', 'display:none!important;');
          document.getElementsByTagName('html')[0].appendChild(div);
        }

        div.innerHTML = JSON.stringify(info);
      }

        // Defer the ajax calls so we can respond when both are complete
      function ajaxCheck() {
        if ( typeof info.version.sitecues_up === 'string' &&
             typeof info.version.sitecues_ws === 'string' ) {

          sitecues.latestStatus = info;
          addStatusInfoToDOM(info);
          callback(info);
        }
      }

      $.ajax({
        cache:    false,
        dataType: 'json',
        type:     'GET',
        url:      ajax_urls.up,
        success: function (response) {

          // Set the version based on the AJAX response object
          info.version.sitecues_up = response.version;
          ajaxCheck();
        },
        error: function () {

          // Set an error message if the AJAX object did not return
          info.version.sitecues_up = 'Error fetching UP version from service URL';
          ajaxCheck();
        }
      });

      $.ajax({
        cache:    false,
        dataType: 'json',
        type:     'GET',
        url:      ajax_urls.ws,
        success: function (response) {

          // Set the version based on the AJAX response object
          info.version.sitecues_ws = response.version;
          ajaxCheck();
        },
        error: function () {

          // Set an error message if the AJAX object did not return
          info.version.sitecues_ws = 'Error fetching WS version from service URL';
          ajaxCheck();
        }
      });
      return 'Fetching sitecues status...';
    };

    sitecues.status = status_module;

    if (SC_UNIT) {
      exports.status = status_module;
    }

    callback();
  });
});
