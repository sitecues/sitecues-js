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
sitecues.def('conf/site', function (site, callback) {

  'use strict';

  var
    // The site configuration data object.
    siteConfig
    // Keep a reference to the provided site config so that we do not override.
    , providedSiteConfig = sitecues.getSiteConfig()
    , isFetched = false
    ;

  sitecues.use('jquery', function($) {
    // Simple get that denies direct access to the root data object. Root scalar properties can not be overwritten,
    // but the contents of root object properties can be modified.
    site.get = function(key) {
      if (key) {
        return siteConfig[key];
      } else {
        return siteConfig; // return all the data
      }
    };

    // Initialize the site configuration to the default.
    siteConfig = $.extend(true, {}, providedSiteConfig);

    function fetchSiteConfig() {
      if (isFetched) {
        return; // Already fetched
      }
      // Trigger the initial fetch.
      $.ajax({
        // The 'provided.site_id' parameter must exist, or else core would have aborted the loading of modules.
        url: '//' + sitecues.getLibraryConfig().hosts.ws + '/sitecues/api/2/site/' + providedSiteConfig.site_id + '/config',
        dataType: 'json',
        success: function (data) {
          // Copy the fetched key/value pairs into the site configuration.
          for (var i = 0; i < data.settings.length; i++) {
            siteConfig[data.settings[i].key] = data.settings[i].value;
          }

          // Add the provided configuration
          siteConfig = $.extend(true, siteConfig, providedSiteConfig);
          isFetched = true;
        }
      });
    }

    sitecues.on('speech/enabled', fetchSiteConfig); // Fetch once we need it

    callback(site);
  });
  
});
