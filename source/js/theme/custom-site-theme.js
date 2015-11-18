/**
 *  Support alterations to themes for specific websites
 */

define(['core/conf/site', 'core/conf/urls'], function(site, urls) {
  // TODO build system could create this variable based on the available themes
  // var SITES_WITH_CUSTOM_THEMES = '__SITES_WITH_CUSTOM_THEMES__';

  var SITES_WITH_CUSTOM_THEMES = { 's-c27fa71d': 1 , 's-0000ee0c':1, 's-05fd6c66':1, 's-167ff09a':1, 's-25cecd79': 1 },
    isInitialized;

  function insertSheet(siteId) {
    var cssLink = document.createElement('link'),
      cssUrl = urls.resolveResourceUrl('css/site-themes/' + siteId + '.css');
    cssLink.setAttribute('rel', 'stylesheet');
    cssLink.setAttribute('href', cssUrl);
    cssLink.id = 'sitecues-custom-theme';
    document.querySelector('head').appendChild(cssLink);
  }

  function init() {
    if (!isInitialized) {
      isInitialized = true;

      var siteId = site.getSiteId();

      if (SITES_WITH_CUSTOM_THEMES.hasOwnProperty(siteId)) {
        insertSheet(siteId);
      }
    }
  }

  return {
    init: init
  };
});
