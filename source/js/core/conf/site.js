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
define([], function() {

  var
    providedSiteConfig = getSiteConfig(),
    everywhereConfig = getEverywhereConfig();

  // Simple get that denies direct access to the root data object. Root scalar properties can not be overwritten,
  // but the contents of root object properties can be modified.
  function get(key) {
    return everywhereConfig[key] || providedSiteConfig[key];
  }

  // Names with underscores deprecated.
  // Here is the order of precedence:
  // 1. sitecues everywhere siteId
  // 2. sitecues.config.siteId (camelCase is the new way)
  // 3. sitecues.config.site_id (underscore in config field names is deprecated)
  function getSiteId() {
    return everywhereConfig.siteId || providedSiteConfig.siteId || providedSiteConfig.site_id;
  }

  function getSiteConfig() {
    return sitecues.config || {};
  }

  // Configuration for sitecues everywhere, if it exists
  function getEverywhereConfig() {
    return sitecues.everywhereConfig || {};
  }

  var publics = {
    get: get,
    getSiteId: getSiteId,
    getSiteConfig: getSiteConfig,
    getEverywhereConfig: getEverywhereConfig
  };
  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
