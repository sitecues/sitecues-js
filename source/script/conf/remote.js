// module for storing settings on the server
eqnx.def('conf/remote', function(remote, callback){

    // depends on conf and jquery module
    eqnx.use('jquery', 'conf', function($, conf){

        conf.get('site-id', function(siteId){

            if(!siteId) {
                siteId=1;
            }
            if(conf.get('remoteConfig') === 'false'){
                console.log("Remote configuration disabled");
                callback();
            } else if (siteId) {
                console.log('Site: ' + siteId);
                $.ajax({
                    url: '//ws.ai2.at/equinox/api/config/' + siteId,
                    dataType: 'json',
                    async: false,
                    success: function(data, status, xhr){
                        // When TTS becomes more modular, we could remove this
                        // specificity and just retain the data object and allow
                        // the modules to find special variables.
                        if (data.azureAccessToken){
                            conf.set('azureAccessToken', data.azureAccessToken);
                        }
                        for(var i = 0; i < data.settings.length; i++){
                            if (conf.get(data.settings[i].key)){
                                console.log(data.settings[i].key + ' is overriden by local value ' + conf.get(data.settings[i].key));
                            } else {
                                conf.set(data.settings[i].key, data.settings[i].value);
                                console.log(data.settings[i].key + ' is using remote value ' + conf.get(data.settings[i].key));
                            }
                        }

                        callback();
                    }
                });
            } else {
                console.log('cannot fetch settings, _setSite is not defined');
                callback();
            }

        });

    });

});