/**
 * Does the current site/browser require classic mode?
 * Classic mode is where the ? shows up instead of the down arrow. This can be necessary if themes aren't working.
 */

define(['core/conf/site', 'core/platform'], function(site, platform) {
  var CLASSIC_SITES = {
    's-00e27714': 1,
    's-013cb0c3': 1,
    's-390bdfa2': 1, // http://www.mtsac.edu/aces/ (SC-3418)
    's-041cf669': 1,
    's-0796b61d': 1, // http://www.brzeziny-gmina.pl -- no sitecues
    's-14949bfa': 1,
    's-190630d2': 1,
    's-2e146908': 1,
    's-389f76da': 1,
    's-456e33ab': 1, // http://www.gminakoscian.pl  -- sitecues broken
    's-4bfe60ab': 1,
    's-542edffc': 1,
    's-548f9948': 1,
    's-570759e3': 1, // http://ialvs.com  -- site down
    's-6097a290': 1,
    's-620610ee': 1,
    's-b737790f': 1,
    's-68a01ec7': 1,
    's-6fd0ef74': 1,
    's-73dd0fcf': 1,
    's-742d6f96': 1, // ruhglobal.com -- No sitecues?
    's-789901d0': 1,
    's-79b6a3ce': 1,
    's-7b90f601': 1,
    's-7d6bc776': 1,
    's-7f2e7ce1': 1,
    's-9afa6ab9': 1,
    's-a5851e07': 1,
    's-acc8f046': 1,
    's-c27fa71d': 1,
    's-d06c2938': 1,
    's-f266b384': 1,
    's-f2a9dde2': 1,
    's-f424d83d': 1,
    's-f78268e1': 1
  };

  function isClassicBrowser() {
    // IE 9 is awful
    // Edge is too, at least for now
    return platform.browser.isIE9 || platform.browser.isEdge;
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