// module for importing settings from page's _eqnx variable
// needed for customer's indentification and customer's settings
eqnx.def('conf/import', function(module, callback) {

    // private variables
    var push, siteId;

    // depends on conf module
    eqnx.use('conf', 'jquery', function(conf, _jQuery) {
        // push setting up to conf
        push = function(data) {
            // there is no data passed
            if (!data || !data.length) return;

            // get conf key
            var key = data.shift();

            // of only one value remains
            // in data use it as value
            if (data.length === 1) data = data[0];

            // export to conf
            conf.set(key, data);
        }

        // settings on the page found
        if ('_eqnx' in window) {
            // iterate over them and push to conf
            for (var i = 0, l = _eqnx.length; i < l; i++)
            push(_eqnx[i]);
            // replace global var
            _eqnx = {
                push: push
            }
        } else {
            console.log('_eqnx not defined!');
        }

        siteId = conf.get('_setSite');
        if (siteId) {
            console.log('Site: ' + siteId);
            _jQuery.ajax({
                url: 'http://ws.ai2.at/api/config/' + siteId,
                dataType: 'json',
                async: false,
                success: function(data, status, xhr) {
                    // When TTS becomes more modular, we could remove this 
                    // specificity and just retain the data object and allow
                    // the modules to find special variables.
                    if (data.azureAccessToken) {
                        conf.set('azureAccessToken', data.azureAccessToken);
                    }
                    for (var i = 0; i < data.settings.length; i++) {
                        if (conf.get(data.settings[i].key)) {
                            console.log(data.settings[i].key + ' is overriden by local value ' + conf.get(data.settings[i].key));
                        } else {
                            conf.set(data.settings[i].key, data.settings[i].value);
                            console.log(data.settings[i].key + ' is using remote value ' + conf.get(data.settings[i].key));
                        }
                    }
                }
            });
        } else {
            console.log('cannot fetch settings, _setSite is not defined')
        }
        // done
        callback();

    });

});
