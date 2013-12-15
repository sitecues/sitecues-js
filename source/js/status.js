sitecues.def('status', function (status_module, callback, log) {
  
  'use strict';

  sitecues.use('jquery', 'speech', 'conf', function ( $, speech, conf ) {

    // The default status formatter: simply log all data to the console log.
    function consoleCallback (info) {
     
      // We need to have JSON and JSON.stringify if this is to work...
      if (console && console.log && JSON && JSON.stringify) {
         
        // Make sure we are not running from a file (unit testing in node)
        if (window.location.protocol !== 'file:') {
          // Make it clear where to begin copying...
          console.log('\n\n-----BEGIN SITECUES STATUS-----');
          
          // Log with pretty-print
          console.log(JSON.stringify(info, null, '\t'));
          
          // Make it clear where to end copying
          console.log('-----END SITECUES STATUS-----\n\n');
        }
      
        // '...sitecues Status logged as JSON Object.';

      // If we don't have JSON or Stringify...
      } else {
        
        // Make sure we are not running from a file (unit testing in node)
        if (window.location.protocol !== 'file:') {
           
           // ...the output will not be quite so pretty
           console.log(info);

        }

        // '...sitecues Status logged as JavaScript Object.';

      }

    }
  

    status_module = function (callback) {
      callback = callback || consoleCallback;

      var data = conf.data()
        , ajax_urls
        , setting
        , popup
        , info
        ;

      info = {
        'current_url'     : window.location.href,
        'sitecues_js_url' : (sitecues.getLibraryUrl()).raw,
        'user_agent'      : navigator.userAgent,
        'tts_status'      : ((speech.isEnabled()) ? 'on' : 'off'),
        'version'         : {
          'sitecues_js'   : sitecues.getVersion(),
          'sitecues_up'   : null,
          'sitecues_ws'   : null
        }
      };

      // Set the ajax URLs
      ajax_urls = {
        up: ( '//' + ( sitecues.getLibraryConfig() ).hosts.up + '/status' ),
        ws: ( '//' + ( sitecues.getLibraryConfig() ).hosts.ws + '/sitecues/api/util/status' )
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
        url:      ajax_urls.ws,
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

      return 'Fetching sitecues status...';
    };

    sitecues.status = status_module;

    if (sitecues.tdd) {
      exports.status = status_module;
    }

    callback();
  });
});