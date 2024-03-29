/**
 *  Support alterations to themes for specific websites
 */

define(['run/conf/site', 'run/conf/urls'], function(site, urls) {
  // TODO build system could create this variable based on the available themes
  // var SITES_WITH_CUSTOM_THEMES = '__SITES_WITH_CUSTOM_THEMES__';

  var SITES_WITH_CUSTOM_THEMES = {
      's-0000ee0c': 1,
      's-05fd6c66': 1,
      's-0796b61d': 1,
      's-167ff09a': 1,
      's-190630d2': 1,
      's-2158b12a': 1,
      's-252baed8': 1,
      's-25cecd79': 1,
      's-389f76da': 1,
      's-4bfe60ab': 1,
      's-570759e3': 1,
      's-6d6f89a3': 1,
      's-73dd0fcf': 1,
      's-7b90f601': 1,
      's-9afa6ab9': 1,
      's-acc8f046': 1,
      's-b427fffb': 1,
      's-c27fa71d': 1,
      's-f2a9dde2': 1
    },
    isInitialized;

  function insertSheet(siteId) {
    var cssLink = document.createElement('link'),
      cssUrl = urls.resolveResourceUrl('css/site-themes/' + siteId + '.css');
    cssLink.setAttribute('rel', 'stylesheet');
    cssLink.setAttribute('href', cssUrl);
    cssLink.id = 'sitecues-js-custom-theme';
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
