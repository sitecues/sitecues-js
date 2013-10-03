// module for importing settings from page's _sitecues variable
// needed for customer's identification and customer's settings
sitecues.def('conf/import', function (module, callback, log) {
  'use strict';

  // depends on conf module
  sitecues.use('conf/main', function(conf_main) {

    // push setting up to conf
    function push (data) {
      
      // there is no data passed
      if (!data || !data.length) {
        return;
      }

      // get conf key
      var key = data.shift();

      // of only one value remains
      // in data use it as value
      if (data.length === 1) {
        data = data[0];
      }

      // export to conf
      conf_main.set(key, data);
    }

    var i, l, key, sitecuesConfig;

    // settings on the page found
    if (!('_sitecues' in window)) {
      log.warn('_sitecues not defined!');

      if (window.sitecues) {
        sitecuesConfig = window.sitecues.config;
        if (sitecuesConfig) {
          for(key in sitecuesConfig) {
            if (sitecuesConfig.hasOwnProperty(key)) {
              conf_main.set(key, window.sitecues.config[key]);
            }
          }
        } else {
          log.warn('Could not find sitecues.config.');
        }
        if (!window.sitecues.coreConfig.hosts) {
          log.warn('Could not find sitecues.coreConfig.hosts.');
        }
      }

    } else {

      if (window._sitecues) {
        
        // iterate over them and push to conf
        for (i=0, l=window._sitecues.length; i < l; i++) {
          push(window._sitecues[i]);
        }
      }
      // replace global var
      window._sitecues = { push: push };
    }

    // done
    callback();

  });

});