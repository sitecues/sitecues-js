/**
 * This module loads values provided in the 'windows.sitecues.userConfig' object
 * into the user configuration manager.
 */
sitecues.def('conf/user/provided', function (provided, callback, log) {
  'use strict';

  // Depends upon the user configuration management module.
  sitecues.use('conf/user/manager', function(manager) {
    var userConfig, key;

    // If this module is loading, we know that the 'window.sitecues' object exists, but let's just be certain.
    if (window.sitecues && window.sitecues.userConfig && (typeof window.sitecues.userConfig == "object")) {
      userConfig = window.sitecues.userConfig;

      // Load the provided values.
      for (key in userConfig) {
        if (userConfig.hasOwnProperty(key)) {
          manager.set(key, userConfig[key]);
        }
      }
    }

    callback();
  });
});
