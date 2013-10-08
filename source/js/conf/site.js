/**
 * This module is responsible for handling site configuration. This configuration can be supplied in
 * two ways:
 *   1) The 'windows.sitecues.config' object:
 *         This object is required and must have at least the 'site_id' and 'script_url' properties. This
 *         requirement is validated by core.js
 *   2) The web services server
 *         This configuration is currently not required, and inability to fetch these setting should be handled
 *         gracefully by the library (e.g., disable TTS, do not crash the web page).
 *
 *   All properties provided in 'windows.sitecues.config' currently take precedence over the server configuration.
 *   However, in the future this will be updated so that a customer can not, for example, override the TTS provider
 *   with one that is not available to them.
 */
sitecues.def('conf/site', function (site, callback, log) {

  var
    // The site configuration.
    siteConfig = {}
    // Keep a reference to the provided site config so that we do not override.
    , providedSiteConfig = sitecues.getSiteConfig()
    // Simple no-op function
    , noop = function(){}
    ;

  sitecues.use('jquery', 'conf/user', function($, user){

    // Simple get that denies direct access to the root data object. Root scaler properties can not be overwritten,
    // but the contents of root object properties can be modified.
    site.get = function(key) {
      return siteConfig[key];
    };

    site.fetch = function(cb) {
      cb = cb || noop;
      $.ajax({
        // The 'provided.site_id' parameter must exist, or else core would have aborted the loading of modules.
        url: '//' + sitecues.getLibraryConfig().hosts.ws + '/sitecues/api/2/site/' + providedSiteConfig.site_id + '/config',
        dataType: 'json',
        async: false,
        success: function(data, status, xhr) {
          log.info("successfully fetched site config from server");

          // Initialize the site configuration object.
          siteConfig = {};

          // TODO: Remove the azure settings form the site configuration and move them to a separate server call.
          if (data.azureAccessToken) {
            // Adjust expiration for offset.
            data.azureAccessToken.expires +=
              new Date().getTime() - data.azureAccessToken.now; // Compute difference in server/local time

            // Set the new azure config.
            siteConfig.azureAccessToken = data.azureAccessToken;
          }

          // Copy the fetched key/value pairs into the site configuration.
          for (var i = 0; i < data.settings.length; i++) {
            siteConfig[data.settings[i].key] = data.settings[i].value;
          }

          // Overlay the provided site configuration.
          for (var key in providedSiteConfig) {
            if (providedSiteConfig.hasOwnProperty(key)) {
              siteConfig[key] = providedSiteConfig[key];
            }
          }

          // TODO: This should not be stored in user config, as it will be persisted across sessions.
          user.set('tts-service-available', true);
          cb();
        },
        error: function() {
          // TODO: This should not be stored in user config, as it will be persisted across sessions.
          user.set('tts-service-available', false);
          cb();
        }
      });
    };

    // Trigger the initial fetch.
    site.fetch(callback);
  });
});