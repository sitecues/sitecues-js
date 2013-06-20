// module for storing settings on the server
sitecues.def('conf/remote', function (remote, callback, log){

    // Create the logger for this module
    var log = window.sitecues.logger.log('remote');

    // depends on conf and jquery module
    sitecues.use('jquery', 'conf', function($, conf){

        remote.fetch = function(callback) {

            conf.get('site-id', function(siteId){

                if( !siteId ) {
                    siteId = 1;
                }
                if(conf.get('remoteConfig') === 'false'){
                    
                    log.info("Remote configuration disabled.");

                    callback();
                } else if (siteId) {
                    log.info('Site: ' + siteId);
                    $.ajax({
                        url: '//' + sitecues.getCoreConfig().hosts.ws + '/equinox/api/config/' + siteId,
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
                                conf.set(data.settings[i].key, data.settings[i].value);
                            }

                            callback();
                        }
                    });
                } else {
                    log.warn('cannot fetch settings, _setSite is not defined');
                    callback();
                }
            });
        }

        remote.fetch(callback);
    });

});