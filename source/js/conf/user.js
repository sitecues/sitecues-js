/**
 * The 'conf/user' manages user user configuration (such as the user-select UI mode) and user
 * session data (such as the current zoom value). This module simply loads the modules
 * necessary for user configuration management, in the order required for initialization.
 * Once all needed modules are loaded, the user data management module id set as the
 * interface into user configuration data.
 *
 * For site-specific configuration (such as the site ID), refer to the 'conf/site' module.
 * For library-specific configuration (such as the server host FQDNs), refer to the
 * 'conf/library' module.
 */
sitecues.def('conf/user', function (userPrefs, callback) {
  // The order of preference for module loading is as follows...

  // First, load the manager module, which is responsible for the actual management of the user configuration.
  // Also ensure there is a valid user ID.
  sitecues.use('conf/user/manager', 'user', function(manager) { // user

    // Second, load the persisted user configuration from the user preferences server.
    sitecues.use('conf/user/server', function() { // server

      // Thirds, load the user configuration provided in the page. These are (usually) provided as overrides
      // in testing, and have precedence over any other user configuration.
      sitecues.use('conf/user/provided', function() { // provided

        // Finally, set the manager as the interface module for user setting.
        callback(manager);
      });
    });
  });
});
