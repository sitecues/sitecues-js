sitecues.def('status', function (status, callback, log) {
  'use strict';

  sitecues.use('jquery', 'speech', 'conf', function ( $, speech, conf ) {

    // The default status formatter: simply log all data to the log.
    function statusCallback (info) {
      function printObj (o, prefix) {
          var p, v, s = '';
          prefix = prefix || '';
          for (p in o) {
            if (o.hasOwnProperty(p)) {
              v = o[p];
              s += prefix + p + ':';
              if (typeof v == 'object') {
                s += '\n' + printObj(v, prefix + '  ');
              } else {
                s += ' ' + v + '\n';
              }
            }
          }
          return s;
        }

      log.info('\n===== BEGIN: SITECUES STATUS =====================\n' + printObj(info) + '===== END: SITECUES STATUS =======================');
    }

    status = function (callback) {
      callback = callback || statusCallback;

      var data = conf.data()
        , ajax_urls
        , setting
        , popup
        , info
        ;

      info = {
        'current_url'     : window.location.href,
        'sitecues_js_url' : (sitecues.getScriptSrcUrl()).raw,
        'user_agent'      : navigator.userAgent,
        'tts_status'      : ((speech.isEnabled()) ? 'on' : 'off'),
        'version'         : {
          'sitecues_js'   : sitecues.APP_VERSION,
          'sitecues_up'   : null,
          'sitecues_ws'   : null
        }
      };

      // Set the ajax URLs
      ajax_urls = {
        up: ( '//' + ( sitecues.getCoreConfig() ).hosts.up + '/status' ),
        ws: ( '//' + ( sitecues.getCoreConfig() ).hosts.ws + '/equinox/api/util/status' )
      };

      // Define the info object to be formatted by the log
      for (setting in data) {
        if (data.hasOwnProperty(setting)){
          info[setting] = data[setting];
        }
      }
      
      // Appends sitecues status to the window in a div (used by Steve for testing)
      function addStatusInfoToDOM(){
        var sitecuesStatusId='sitecues-status-output'
          , div = document.getElementById(sitecuesStatusId)
          ;
        
        if (div) {
          div.innerHTML = '';
        } else {
          div = document.createElement('div');
          div.setAttribute('id', 'sitecues-status-output');
          div.setAttribute('style', 'display:none!important;');
          document.getElementsByTagName('html')[0].appendChild(div);
        }

        div.innerHTML = JSON.stringify(info);
      }

        // Defer the ajax calls so we can respond when both are complete
      function ajaxCheck () {
        if ( typeof info.version.sitecues_up === 'string' && 
             typeof info.version.sitecues_ws === 'string' ) {
          
          callback(info);
          addStatusInfoToDOM(info);
        }
      }

      $.ajax({
        cache:    false,
        dataType: 'json',
        type:     'GET',
        url:      ajax_urls.up,
        success: function(response){
          
          // Set the version based on the AJAX response object
          info.version.sitecues_up = response.version;
          ajaxCheck();
        },
        error: function(){
          
          // Set an error message if the AJAX object did not return
          info.version.sitecues_up = 'Error Fetching Version from Service URL';
          ajaxCheck();
        }
      });
        
      $.ajax({
        cache:    false,
        dataType: 'json',
        type:     'GET',
        url:      ajax_urls.WS,
        success: function(response){
          
          // Set the version based on the AJAX response object
          info.version.sitecues_ws = response.version;
          ajaxCheck();
        },
        error: function(){

          // Set an error message if the AJAX object did not return
          info.version.sitecues_ws = 'Error Fetching Version from Service URL';
          ajaxCheck();
        }
      });

      // Popup the logger and report status
      if (sitecues.logger){
        popup = sitecues.logger.appenders.popup;
        popup.show();
        popup.focus();
      }

      return 'Getting sitecues status.';
    };

    sitecues.status = status;

    if (sitecues.tdd) {
      exports.status = { get: status };
    }

    callback();
  });
});