// module for importing settings from page's _sitecues variable
// needed for customer's indentification and customer's settings
sitecues.def('conf/import', function(module, callback) {

    // depends on conf module
    sitecues.use('conf', function(conf) {

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
            conf.set(key, data);
        }

        // settings on the page found
        if ('_eqnx' in window) {
            // iterate over them and push to conf
            for (var i = 0, l = _eqnx.length; i < l; i++)
                push(_eqnx[i]);
        } else {
            console.log('_eqnx not defined!');
        }

        // replace global var
        _eqnx = { push: push }

        // done
        callback();

    });

});
