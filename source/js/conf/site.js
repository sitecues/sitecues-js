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
define(['jquery'], function($) {

  var
    fetchedSiteConfig = {},
    providedSiteConfig = sitecues.getSiteConfig(),
    everywhereConfig = sitecues.getEverywhereConfig(),
    isSiteConfigFetchNeeded = false;

  // Simple get that denies direct access to the root data object. Root scalar properties can not be overwritten,
  // but the contents of root object properties can be modified.
  function get(key) {
    if (!key) {
      return fetchSiteConfig;
    }

    return everywhereConfig[key] || fetchedSiteConfig[key] || providedSiteConfig[key];
  }

  // Names with underscores deprecated.
  // Here is the order of precedence:
  // 1. sitecues everywhere siteId
  // 2. sitecues.config.siteId (camelCase is the new way)
  // 3. sitecues.config.site_id (underscore in config field names is deprecated)
  function getSiteId() {
    return everywhereConfig.siteId || providedSiteConfig.siteId || providedSiteConfig.site_id;
  }

  // The everywhereConfig will be an empty object or will
  // contain sitecues everywhere configuration, in which case it will contain a siteId
  function isEverywhereConfigValid() {
    return everywhereConfig.siteId;
  }

  function fetchSiteConfig() {
    if (SC_LOCAL || isEverywhereConfigValid()) {
      // Cannot save to server when we have no access to it
      // Putting this condition in allows us to paste sitecues into the console
      // and test it on sites that have a content security policy
      return;
    }

    if (isSiteConfigFetchNeeded) {
      return; // Already being fetched or we already have the info
    }

    isSiteConfigFetchNeeded = true;

    // Trigger the initial fetch.
    $.ajax({
      // The 'provided.siteId' parameter must exist, or else core would have aborted the loading of modules.
      url: sitecues.getApiUrl('2/site/' + getSiteId() + '/config'),
      dataType: 'json',
      success: function (data) {
        // Copy the fetched key/value pairs into the site configuration.
        for (var i = 0; i < data.settings.length; i++) {
          fetchedSiteConfig[data.settings[i].key] = data.settings[i].value;
        }

        // Add the provided configuration
        fetchedSiteConfig = $.extend(true, fetchedSiteConfig, providedSiteConfig);
      }
    });
  }

  // Fetch once we need it (we currently need it if speech might be used, because the fetched
  // site config may specify different speech servers)
  sitecues.on('speech/did-change zoom/begin', fetchSiteConfig);

  var publics = {
    get: get,
    getSiteId: getSiteId
  };
  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
