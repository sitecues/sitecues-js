// module for importing settings from page's _sitecues variable
// needed for customer's identification and customer's settings
sitecues.def('conf/import', function (module, callback, log) {

    // depends on conf module
    sitecues.use('conf/main', function(conf_main) {

        // push setting up to conf
        var push = function(data) {
            // there is no data passed
            if (!data || !data.length) return;

            // get conf key
            var key = data.shift();

            // of only one value remains
            // in data use it as value
            if (data.length === 1) data = data[0];

            // export to conf
            conf_main.set(key, data);
        }

        // settings on the page found
        if ('_sitecues' in window) {
            // iterate over them and push to conf
            for (var i = 0, l = _sitecues.length; i < l; i++)
                push(_sitecues[i]);
        } else {
            log.warn('_sitecues not defined!');
        }

        // replace global var
        _sitecues = { push: push }

        // done
        callback();

    });

});
