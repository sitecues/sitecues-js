/**
 * The 'conf' module load the configuration modules in the proper order, and acts as an alias
 * for the 'conf/user' module. The conf module should only be used to manage user configuration
 * (such as the user-select UI mode), or user session data (such as the current zoom value).
 *
 * For site-specific configuration (such as the site ID), refer to the 'conf/site' module.
 */
sitecues.def('conf', function (conf, callback, log) {

  // First, load user configuration.
  sitecues.use('conf/user', function(user) {

    // Second, load site configuration.
    sitecues.use('conf/site', function() {

      // Finally, set the user configuration module as the implementation of this module.
      callback(user)
    });
  });
});
