/**
 * This module is responsible for handling site configuration. This configuration can be supplied in
 * two ways:
 *   1) The 'window.sitecues.config' object
 *         This object is required and must have at least the 'siteId' and 'appUrl' properties.
 *         This requirement is validated by sitecues-core.
 *   2) The web services server
 *         This configuration is currently not supported, but could be again in the future.
 *         The TTS library does use this infrastructure to determine whether TTS is enabled (see network-player.js)
 *
 *   All properties provided in 'window.sitecues.config' currently take precedence over the server configuration.
 *   However, in the future this will be updated so that a customer can not, for example, override the TTS provider
 *   with one that is not available to them.
 */
define([], function() {

  var
    providedSiteConfig,
    everywhereConfig;

  // Get the site configuration property
  function get(key) {
    return getEverywhereConfig()[key] || getProvidedSiteConfig()[key];
  }

  // Names with underscores deprecated.
  // Here is the order of precedence:
  // 1. sitecues everywhere siteId
  // 2. sitecues.config.siteId (camelCase is the new way)
  // 3. sitecues.config.site_id (underscore in config field names is deprecated)
  function getSiteId() {
    var siteId = everywhereConfig.siteId || providedSiteConfig.siteId || providedSiteConfig.site_id;
    return siteId && siteId.trim();
  }

  // Get the entire site config object
  function getProvidedSiteConfig() {
    return sitecues.config || {};
  }

  // Configuration for sitecues everywhere, if it exists
  // TODO Should go away once we go to the new extension which is entirely in a content script
  function getEverywhereConfig() {
    return sitecues.everywhereConfig || {};
  }

  function init() {
    providedSiteConfig = getProvidedSiteConfig();
    everywhereConfig = getEverywhereConfig();
  }

  return {
    init : init,
    get: get,
    getSiteId: getSiteId,
    getSiteConfig: getProvidedSiteConfig,
    getEverywhereConfig: getEverywhereConfig
  };
});
