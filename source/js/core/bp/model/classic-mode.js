/**
 * Does the current site/browser require classic mode?
 * Classic mode is where the ? shows up instead of the down arrow. This can be necessary if themes aren't working.
 */

define(['core/conf/site', 'core/platform'], function(site, platform) {
  var CLASSIC_SITES = {
    // 's-b737790f': 1  // http://www.window-eyes.at
  };

  function isClassicBrowser() {
    // Edge is too, at least for now
    return platform.browser.isEdge;
  }

  function isClassicSite() {
    var classicPref = site.get('classicMode');
    if (typeof classicPref !== 'undefined') {
      return classicPref;
    }
    return CLASSIC_SITES[site.getSiteId()];
  }

  function isClassicMode() {
    return Boolean(isClassicSite() || isClassicBrowser());
  }

  return isClassicMode;
});
