/**
 * This module is responsible for handling site configuration. This configuration can be supplied in
 * two ways:
 *   1) The 'windows.sitecues.config' object:
 *         This object is required and must have at least the 'siteId' and 'scriptUrl' properties. This
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
    fetchedSiteConfig = {},
    providedSiteConfig = sitecues.getSiteConfig(),
    everywhereConfig = sitecues.getEverywhereConfig(),
    isFetched = false;

  sitecues.use('jquery', function($) {
    // Simple get that denies direct access to the root data object. Root scalar properties can not be overwritten,
    // but the contents of root object properties can be modified.
    site.get = function(key) {
      if (!key) {
        return fetchSiteConfig;
      }

      return everywhereConfig[key] || fetchedSiteConfig[key] || providedSiteConfig[key];
    };

    // Names with underscores deprecated
    site.getSiteId = function() {
      return providedSiteConfig.siteId || providedSiteConfig.site_id;
    };

    function fetchSiteConfig() {
      if (isFetched) {
        return; // Already fetched
      }

      if (SC_LOCAL || everywhereConfig) {
        // Cannot save to server when we have no access to it
        // Putting this condition in allows us to paste sitecues into the console
        // and test it on sites that have a content security policy
        return;
      }

      // Trigger the initial fetch.
      $.ajax({
        // The 'provided.siteId' parameter must exist, or else core would have aborted the loading of modules.
        url: sitecues.getApiUrl('/2/site/' + site.getSiteId() + '/config'),
        dataType: 'json',
        success: function (data) {
          // Copy the fetched key/value pairs into the site configuration.
          for (var i = 0; i < data.settings.length; i++) {
            fetchedSiteConfig[data.settings[i].key] = data.settings[i].value;
          }

          // Add the provided configuration
          fetchedSiteConfig = $.extend(true, fetchedSiteConfig, providedSiteConfig);
          isFetched = true;
        }
      });
    }

    // Fetch once we need it (we currently need it if speech might be used, because the fetched
    // site config may specify different speech servers)
    sitecues.on('speech/did-change zoom/begin', fetchSiteConfig);

    callback(site);
  });
  
});
