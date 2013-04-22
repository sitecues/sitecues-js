// module for storing settings on the server
eqnx.def('conf/remote', function(remote, callback){

    // depends on conf and jquery module
    eqnx.use('jquery', 'conf', function($, conf){

        remote.fetch = function() {

            conf.get('site-id', function(siteId){

                if( !siteId ) {
                    siteId = 1;
                }
                if(conf.get('remoteConfig') === 'false'){
                    console.log("Remote configuration disabled");
                    callback();
                } else if (siteId) {
                    console.log('Site: ' + siteId);
                    $.ajax({
                        url: '//ws.sitecues.com/equinox/api/config/' + siteId,
                        dataType: 'json',
                        async: false,
                        success: function(data, status, xhr){
                            console.log("success");
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
                    console.log('cannot fetch settings, _setSite is not defined');
                    callback();
                }
            });
        }

        remote.fetch();
    });

});