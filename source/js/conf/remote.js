// module for storing settings on the server
sitecues.def('conf/remote', function (remote, callback, log){

  // Create the logger for this module
  // var log = window.sitecues.logger.log('remote');

  // depends on conf and jquery module
  sitecues.use('jquery', 'conf/main', function($, conf_main){

    remote.fetch = function(callback) {

      // Try 'site_id' first (underscore)
      var site_id = conf_main.get('site_id');

      if (!site_id) {        
        // Then try 'site-id' (dash) ((to be depreciated soon))
        var site_id = conf_main.get('site-id');
        
        if (!site_id) {
          site_id = 1;
        }
      }

      if(conf_main.get('remoteConfig') === 'false'){
        log.info("Remote configuration disabled.");

        callback();
      } else if (site_id) {
        log.info('Site: ' + site_id);
        $.ajax({
          url: '//' + sitecues.getCoreConfig().hosts.ws + '/equinox/api/config/' + site_id,
          dataType: 'json',
          async: false,
          success: function(data, status, xhr){
            log.info("success");
            
            // When TTS becomes more modular, we could remove this
            // specificity and just retain the data object and allow
            // the modules to find special variables.
            if (data.azureAccessToken) {
            
              // Compute difference in server/local time
              var offset = new Date().getTime() - data.azureAccessToken.now;
            
              // Adjust expiration for offset
              data.azureAccessToken.expires += offset;
              remote.azureAccessToken = data.azureAccessToken;
            }
            for (var i = 0; i < data.settings.length; i++) {
              conf_main.set(data.settings[i].key, data.settings[i].value);
            }

            conf_main.set('tts-service-available', true);
            callback();
          },
          error: function(){
            conf_main.set('tts-service-available', false);
            callback();
          }
        });
      } else {
        log.warn('cannot fetch settings, _setSite is not defined');
        callback();
      }
    };

    remote.fetch(callback);

  });

});